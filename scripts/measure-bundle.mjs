import { readFile, readdir, mkdir, writeFile } from 'node:fs/promises'
import { gzipSync } from 'node:zlib'

const qaDirectory = process.argv.includes('--record-evidence') ? 'docs/qa/gate-1' : 'test-results/gate-1'
// All routes are eagerly bundled. Count every emitted JS chunk so shared chunks cannot be omitted.
const files = (await readdir('dist/assets')).filter((file) => file.endsWith('.js'))
const chunks = await Promise.all(files.map(async (file) => {
  const buffer = await readFile(`dist/assets/${file}`)
  return { file, bytes: buffer.length, gzipBytes: gzipSync(buffer).length }
}))
const gzipBytes = chunks.reduce((sum, chunk) => sum + chunk.gzipBytes, 0)
const baseline = JSON.parse(await readFile('docs/qa/gate-0/bundle.json', 'utf8'))
const result = { chunks, gzipBytes, gate0GzipBytes: baseline.gzipBytes,
  increaseBytes: gzipBytes - baseline.gzipBytes, hardBudgetBytes: 200_000 }
await mkdir(qaDirectory, { recursive: true })
await writeFile(`${qaDirectory}/bundle.json`, JSON.stringify(result, null, 2) + '\n')
console.log(JSON.stringify(result, null, 2))
if (gzipBytes >= 200_000) process.exitCode = 1
