import { createHash } from 'node:crypto'
import { readFile, mkdir, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { analyzeBundle } from './bundle-metrics.mjs'

const qaDirectory = process.argv.includes('--record-evidence') ? 'docs/qa/gate-2' : 'test-results/gate-2'
const metadata = JSON.parse(await readFile('dist/bundle-graph.json', 'utf8'))
if (metadata.schemaVersion !== 1) throw new Error('Unknown bundle graph; run npm run build first')
const chunks = await Promise.all(metadata.chunks.map(async (chunk) => {
  const code = await readFile(join('dist', chunk.fileName), 'utf8')
  if (createHash('sha256').update(code).digest('hex') !== chunk.sha256) {
    throw new Error(`Bundle graph is stale for ${chunk.fileName}; run npm run build`)
  }
  return { ...chunk, code }
}))
const html = await Promise.all(metadata.html.map(async (asset) => ({
  ...asset, source: await readFile(join('dist', asset.fileName), 'utf8'),
})))
const graph = analyzeBundle([...chunks, ...html])
const reference = JSON.parse(await readFile('docs/qa/gate-1/bundle.json', 'utf8'))
const result = { schemaVersion: 1, capturedAt: new Date().toISOString(),
  initialDefinition: 'Entry + transitive static imports + HTML modulepreloads; each emitted JS asset gzipped once',
  gate1GzipBytes: reference.gzipBytes, initialIncreaseBytes: graph.initial.gzipBytes - reference.gzipBytes,
  hardBudgetBytes: 200_000, ...graph,
  passed: graph.boundaryPassed && graph.initial.gzipBytes < 200_000 }
await mkdir(qaDirectory, { recursive: true })
await writeFile(`${qaDirectory}/bundle.json`, JSON.stringify(result, null, 2) + '\n')
console.log(JSON.stringify({ initialGzipBytes: graph.initial.gzipBytes,
  deferredGzipBytes: graph.deferred.gzipBytes, totalGzipBytes: graph.total.gzipBytes,
  initialFirestoreChunks: graph.initialFirestoreChunks, passed: result.passed }, null, 2))
if (!result.passed) process.exitCode = 1
