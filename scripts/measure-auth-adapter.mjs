import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { gzipSync } from 'node:zlib'
import { build, version as viteVersion } from 'vite'

const limitBytes = 50_000
const reference = JSON.parse(await readFile('docs/qa/gate-0/bundle.json', 'utf8'))

async function measure(includeAdapter) {
  const result = await build({
    build: { write: false, reportCompressedSize: false },
    plugins: includeAdapter ? [{
      name: 'measure-complete-auth-adapter',
      enforce: 'pre',
      transform(code, id) {
        if (!id.replaceAll('\\', '/').endsWith('/src/main.tsx')) return
        // Only this in-memory measurement build exposes the adapter. Every export
        // must survive tree shaking, including popup/sign-out before any UI exists.
        return `${code}\nimport * as adapter from './lib/firebase/auth';\n` +
          'Object.assign(globalThis, { __tasklyMeasuredAuthAdapter: adapter });\n'
      },
    }] : [],
  })
  const outputs = (Array.isArray(result) ? result : [result]).flatMap((item) => item.output)
  const chunks = outputs.filter((item) => item.type === 'chunk').map((chunk) => ({
    file: chunk.fileName,
    bytes: Buffer.byteLength(chunk.code),
    gzipBytes: gzipSync(chunk.code).length,
  }))
  return { chunks, gzipBytes: chunks.reduce((sum, chunk) => sum + chunk.gzipBytes, 0) }
}

const baseline = await measure(false)
const adapterOnly = await measure(true)
const increaseBytes = adapterOnly.gzipBytes - baseline.gzipBytes
const result = {
  capturedAt: new Date().toISOString(), firebaseVersion: '13.0.0',
  nodeVersion: process.version, viteVersion,
  method: 'Matched production builds; all adapter exports retained; no auth UI or bootstrap changes',
  recordedGate0GzipBytes: reference.gzipBytes,
  baseline, adapterOnly, increaseBytes, limitBytes, passed: increaseBytes <= limitBytes,
}
await mkdir('docs/qa/gate-1', { recursive: true })
await writeFile('docs/qa/gate-1/auth-adapter-bundle.json', JSON.stringify(result, null, 2) + '\n')
console.log(JSON.stringify(result, null, 2))
if (!result.passed) process.exitCode = 1
