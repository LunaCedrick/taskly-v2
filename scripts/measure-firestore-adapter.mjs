import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { resolve } from 'node:path'
import { build, version as viteVersion } from 'vite'
import { analyzeBundle } from './bundle-metrics.mjs'
import { normalizeBundleEvidence, validateBundleGraph } from './bundle-graph.mjs'

// Each write:false build validates its own in-memory graph; no saved dist is required.

const scaffoldRevision = '9a111e7'
const qaDirectory = process.argv.includes('--record-evidence') ? 'docs/qa/gate-2' : 'test-results/gate-2'
const virtualProbe = '\0taskly:firestore-measurement'
const adapterPath = resolve('src/lib/firebase/firestore.ts').replaceAll('\\', '/')
const reference = JSON.parse(await readFile('docs/qa/gate-1/bundle.json', 'utf8'))
const firebaseVersion = JSON.parse(await readFile('node_modules/firebase/package.json', 'utf8')).version
if (firebaseVersion !== '13.0.0') throw new Error('Adapter measurement requires exact firebase@13.0.0')

const scaffoldFiles = execFileSync('git', [
  'ls-tree', '-r', '--name-only', scaffoldRevision, 'src',
], { encoding: 'utf8' }).trim().split(/\r?\n/)
const scaffoldSources = new Map(scaffoldFiles.map((file) => [
  resolve(file).replaceAll('\\', '/'),
  // Match the measured G1 checkout explicitly; LF changes emitted asset hashes/bytes.
  execFileSync('git', ['show', `${scaffoldRevision}:${file}`], { encoding: 'utf8' }).replace(/\r?\n/g, '\r\n'),
]))
const readExports = ['onSnapshot', 'query', 'orderBy', 'limit', 'collection',
  'initializeFirestore', 'memoryLocalCache', 'connectFirestoreEmulator']
const writeExports = ['setDoc', 'updateDoc', 'deleteDoc', 'writeBatch', 'serverTimestamp', 'Timestamp']

function probeSource(extended) {
  return `export { initializeBrowserFirestore } from ${JSON.stringify(adapterPath)};\n`
    + `export { ${[...readExports, ...(extended ? writeExports : [])].join(', ')} } from 'firebase/firestore';\n`
}

function mainProbe(strategy) {
  if (strategy === 'eager-control') {
    return "\nimport * as probe from 'taskly:firestore-measurement';\n"
      + 'Object.assign(globalThis, { __tasklyMeasuredFirestoreAdapter: probe });\n'
  }
  // Only in-memory measurement builds contain this Auth-gated retention hook.
  return "\nimport { useStore as __measureStore } from './store';\n"
    + 'let __measurementLoaded = false;\n'
    + 'const __measureSignedIn = (state) => {\n'
    + "  if (state.sessionStatus !== 'signed-in' || __measurementLoaded) return;\n"
    + '  __measurementLoaded = true;\n'
    + "  void import('taskly:firestore-measurement').then((probe) =>\n"
    + '    Object.assign(globalThis, { __tasklyMeasuredFirestoreAdapter: probe }));\n'
    + '};\n__measureStore.subscribe(__measureSignedIn);\n'
    + '__measureSignedIn(__measureStore.getState());\n'
}

async function measure(strategy, extended = false) {
  let graphPlugin
  const result = await build({
    mode: 'production', logLevel: 'silent',
    build: { write: false, reportCompressedSize: false },
    plugins: [{
      name: 'taskly-frozen-g1-adapter-measurement', enforce: 'pre',
      configResolved(config) {
        graphPlugin = config.plugins.find((plugin) => plugin.name === 'taskly-bundle-graph')
      },
      resolveId(id) { if (id === 'taskly:firestore-measurement') return virtualProbe },
      load(id) {
        if (id === virtualProbe) return probeSource(extended)
        return scaffoldSources.get(id.replaceAll('\\', '/'))
      },
      transform(code, id) {
        if (strategy !== 'baseline' && id.replaceAll('\\', '/').endsWith('/src/main.tsx')) {
          return code + mainProbe(strategy)
        }
      },
    }],
  })
  const outputs = (Array.isArray(result) ? result : [result]).flatMap((item) => item.output)
  const modules = graphPlugin?.api?.getGraph()
  const graph = analyzeBundle(validateBundleGraph(modules, outputs))
  return { ...graph, moduleEvidence: modules.chunks.map((chunk) => ({
    fileName: chunk.fileName, sha256: chunk.sha256, modules: chunk.modules,
  })) }
}

const baseline = await measure('baseline')
const adapterOnly = await measure('lazy')
const extendedAdapterOnly = await measure('lazy', true)
let eagerControlRejected = false
let eagerControlMessage = ''
try {
  await measure('eager-control')
} catch (error) {
  if (!String(error.message).includes('Firestore runtime reaches initial JavaScript:')) throw error
  eagerControlRejected = true
  eagerControlMessage = error.message
}
if (!eagerControlRejected) throw new Error('Production boundary failed to reject the eager control')

const passed = [baseline, adapterOnly, extendedAdapterOnly].every((measurement) =>
  measurement.boundaryPassed && measurement.initial.gzipBytes < 200_000)
const result = normalizeBundleEvidence({
  schemaVersion: 1, capturedAt: new Date().toISOString(), scaffoldRevision,
  firebaseVersion, nodeVersion: process.version, viteVersion,
  adapterSha256: createHash('sha256').update(await readFile(adapterPath)).digest('hex'),
  frozenSourceLineEndings: 'CRLF, explicitly matching the G1 working-tree baseline on every platform',
  method: 'Matched production builds of frozen G1 sources; Auth-gated virtual dynamic import; all listed exports retained; no product bootstrap integration',
  initialDefinition: 'Entry + transitive static imports + HTML modulepreloads, deduplicated; sum each JS asset gzip once',
  historicalGate1GzipBytes: reference.gzipBytes, hardBudgetBytes: 200_000,
  readExports, writeExports, baseline, adapterOnly, extendedAdapterOnly,
  increases: {
    initialReadBytes: adapterOnly.initial.gzipBytes - baseline.initial.gzipBytes,
    totalReadBytes: adapterOnly.total.gzipBytes - baseline.total.gzipBytes,
    initialExtendedBytes: extendedAdapterOnly.initial.gzipBytes - baseline.initial.gzipBytes,
    totalExtendedBytes: extendedAdapterOnly.total.gzipBytes - baseline.total.gzipBytes,
    extendedOverReadBytes: extendedAdapterOnly.total.gzipBytes - adapterOnly.total.gzipBytes,
  },
  eagerControlRejected, eagerControlMessage, passed,
  runtimeMeasurements: 'UNVERIFIED: signed-in network transfer and 4x CPU first-data latency require later session/listener integration; this harness only builds',
})
await mkdir(qaDirectory, { recursive: true })
// Keep each top-level evidence value on one line, including complete module-ID arrays.
await writeFile(`${qaDirectory}/firestore-adapter-bundle.json`, '{\n'
  + Object.entries(result).map(([key, value]) => `  ${JSON.stringify(key)}: ${JSON.stringify(value)}`).join(',\n')
  + '\n}\n')
console.log(JSON.stringify({ scaffoldRevision, measurements: Object.fromEntries(
  Object.entries({ baseline, adapterOnly, extendedAdapterOnly }).map(([name, item]) => [name, {
    initialGzipBytes: item.initial.gzipBytes, deferredGzipBytes: item.deferred.gzipBytes,
    totalGzipBytes: item.total.gzipBytes, initialFirestoreChunks: item.initialFirestoreChunks,
  }]),
), increases: result.increases, eagerControlRejected, passed }, null, 2))
if (!passed) process.exitCode = 1
