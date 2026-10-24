import { mkdir, writeFile } from 'node:fs/promises'
import { resolve, dirname } from 'node:path'
import { pathToFileURL } from 'node:url'
import { build } from 'vite'
import react from '@vitejs/plugin-react'
import { normalizeBundleEvidence } from '../../scripts/bundle-graph.mjs'

const [root, out, variant = 'normal'] = process.argv.slice(2).map((v, i) => i < 2 ? resolve(v) : v)
const evidence = dirname(out)
const { bundleGraphPlugin } = await import(pathToFileURL(resolve(root, 'vite.config.ts')).href)
const boundary = bundleGraphPlugin({ graphPath: resolve(evidence, 'graph.json') })
const removed = { probeLoad: 0, probeInstall: 0, listenerInspect: 0, observerInspect: 0 }
function replace(code, expression, replacement, key) {
  const next = code.replace(expression, replacement)
  if (next === code) throw new Error(`Diagnostic transform did not find ${key}`)
  removed[key]++
  return next
}
const stripping = { name: 'g3-test-only-no-probe-inspect', enforce: 'pre', transform(code, id) {
  if (id.endsWith('/src/lib/subscriptions/index.ts')) {
    code = replace(code, "if (import.meta.env.MODE === 'e2e') writeTesting = import('./write-test-probe')", '', 'probeLoad')
    code = replace(code, "if (import.meta.env.MODE === 'e2e') probe?.installWriteTestProbe(database)", '', 'probeInstall')
  }
  if (id.endsWith('/src/lib/subscriptions/listeners.ts')) {
    code = replace(code, 'options.observer?.inspect?.(stream, change.doc)', '', 'listenerInspect')
  }
  if (id.endsWith('/src/lib/subscriptions/test-observer.ts')) {
    code = replace(code, /return \{ inspect\(stream, document\) \{[\s\S]*?\}, event\(event\) \{/, 'return { event(event) {', 'observerInspect')
  }
  return code
} }
await mkdir(evidence, { recursive: true })
const result = await build({ configFile: false, root, mode: 'e2e', envDir: resolve(evidence, 'empty-env'),
  plugins: [react(), ...(variant === 'no-probe' ? [stripping] : []), boundary],
  build: { outDir: out, emptyOutDir: true, reportCompressedSize: false }, logLevel: 'warn' })
const outputs = (Array.isArray(result) ? result : [result]).flatMap((item) => item.output)
const chunks = outputs.filter((item) => item.type === 'chunk')
const proof = { variant, removed, probeModule: chunks.some((item) => Object.keys(item.modules)
  .some((id) => id.includes('/subscriptions/write-test-probe'))),
probeMarker: chunks.some((item) => item.code.includes('__TASKLY_G3_WRITES_TEST__')),
inspectInAppChunks: chunks.filter((item) => Object.keys(item.modules).some((id) =>
  /subscriptions\/(listeners|test-observer)\.ts$/.test(id))).some((item) => /\.inspect\b|\binspect\(/.test(item.code)),
environment: 'e2e; explicit fake demo Firebase variables; empty envDir; same config on A/B/C' }
if (variant === 'no-probe' && (Object.values(removed).some((count) => count !== 1)
  || proof.probeModule || proof.probeMarker || proof.inspectInAppChunks)) throw new Error('C variant stripping proof failed')
await writeFile(resolve(evidence, 'build-proof.json'), JSON.stringify(normalizeBundleEvidence(proof)) + '\n')
