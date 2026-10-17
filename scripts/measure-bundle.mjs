import { readFile, readdir, mkdir, writeFile } from 'node:fs/promises'
import { gzipSync } from 'node:zlib'

// All routes are eagerly bundled. Count every emitted JS chunk so shared chunks cannot be omitted.
const files = (await readdir('dist/assets')).filter((file) => file.endsWith('.js'))
const chunks = await Promise.all(files.map(async (file) => {
  const buffer = await readFile(`dist/assets/${file}`)
  return { file, bytes: buffer.length, gzipBytes: gzipSync(buffer).length }
}))
const gzipBytes = chunks.reduce((sum, chunk) => sum + chunk.gzipBytes, 0)
const result = { chunks, gzipBytes, interimTargetBytes: 100_000, hardBudgetBytes: 200_000 }
await mkdir('docs/qa/gate-0', { recursive: true })
await writeFile('docs/qa/gate-0/bundle.json', JSON.stringify(result, null, 2) + '\n')
console.log(JSON.stringify(result, null, 2))
if (gzipBytes >= 200_000) process.exitCode = 1
