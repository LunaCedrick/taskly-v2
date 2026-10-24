import { readFile, mkdir, writeFile } from 'node:fs/promises'
import { analyzeBundle } from './bundle-metrics.mjs'
import { readBundleGraph } from './bundle-graph.mjs'

const qaDirectory = process.argv.includes('--record-evidence') ? 'docs/qa/gate-3' : 'test-results/gate-3'
const { outputs } = await readBundleGraph()
const graph = analyzeBundle(outputs)
const reference = JSON.parse(await readFile('docs/qa/gate-2/bundle.json', 'utf8'))
const result = { schemaVersion: 1, capturedAt: new Date().toISOString(),
  initialDefinition: 'Entry + transitive static imports + HTML modulepreloads; each emitted JS asset gzipped once',
  gate2GzipBytes: { initial: reference.initial.gzipBytes, deferred: reference.deferred.gzipBytes,
    total: reference.total.gzipBytes },
  deltaGzipBytes: { initial: graph.initial.gzipBytes - reference.initial.gzipBytes,
    deferred: graph.deferred.gzipBytes - reference.deferred.gzipBytes,
    total: graph.total.gzipBytes - reference.total.gzipBytes },
  hardBudgetBytes: 200_000, ...graph,
  passed: graph.boundaryPassed && graph.initial.gzipBytes < 200_000 }
await mkdir(qaDirectory, { recursive: true })
await writeFile(`${qaDirectory}/bundle.json`, JSON.stringify(result, null, 2) + '\n')
console.log(JSON.stringify({ initialGzipBytes: graph.initial.gzipBytes,
  deferredGzipBytes: graph.deferred.gzipBytes, totalGzipBytes: graph.total.gzipBytes,
  initialFirestoreChunks: graph.initialFirestoreChunks, passed: result.passed }, null, 2))
if (!result.passed) process.exitCode = 1
