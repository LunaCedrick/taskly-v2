import { build } from 'vite'
import react from '@vitejs/plugin-react'
import { mkdir, mkdtemp, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { analyzeBundle } from '../../scripts/bundle-metrics.mjs'

// Child-process-only environment. No .env content is read, printed, renamed or edited.
for (const key of Object.keys(process.env)) if (key.startsWith('VITE_')) delete process.env[key]
const directory = await mkdtemp(resolve('docs/qa/gate-3/bundle-no-env-'))
await mkdir(resolve(directory, 'empty-env'))
const measurements = {}
for (const [side, root] of [['main', resolve('test-results/gate-3/review-main')], ['branch', process.cwd()]]) {
  const { bundleGraphPlugin } = await import(pathToFileURL(resolve(root, 'vite.config.ts')).href)
  const boundary = bundleGraphPlugin()
  const result = await build({ configFile: false, root, mode: 'production', envDir: resolve(directory, 'empty-env'),
    plugins: [react(), boundary], build: { write: false, reportCompressedSize: false }, logLevel: 'warn' })
  const outputs = (Array.isArray(result) ? result : [result]).flatMap((item) => item.output)
  const graph = analyzeBundle(outputs)
  measurements[side] = { initial: graph.initial.gzipBytes, deferred: graph.deferred.gzipBytes,
    total: graph.total.gzipBytes, boundaryPassed: graph.boundaryPassed }
  await writeFile(resolve(directory, `${side}-graph.json`), JSON.stringify(boundary.api.getGraph()) + '\n')
}
await writeFile(resolve(directory, 'measurements.json'), JSON.stringify({
  environment: 'production; empty envDir; all VITE_* removed from child process; no local .env',
  measurements }) + '\n')
console.log(JSON.stringify({ directory, measurements }))
