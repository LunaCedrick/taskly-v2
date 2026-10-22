// @vitest-environment node
import { spawnSync } from 'node:child_process'
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { afterEach, expect, it } from 'vitest'
import { BUNDLE_GRAPH_PATH, createBundleGraph, normalizeBundleEvidence,
  readBundleGraph, validateBundleGraph } from '../../scripts/bundle-graph.mjs'
import type { BundleOutput } from '../../scripts/bundle-metrics.mjs'

const directories: string[] = []
const outputs: BundleOutput[] = [
  { fileName: 'entry.js', code: 'globalThis.fixture = true;', isEntry: true, modules: {} },
  { fileName: 'index.html', source: '<script type="module" src="/entry.js"></script>' },
]

afterEach(async () => { await Promise.all(directories.splice(0).map((directory) =>
  rm(directory, { recursive: true, force: true }))) })

async function fixture() {
  const directory = await mkdtemp(join(tmpdir(), 'taskly-graph-validation-'))
  directories.push(directory)
  const dist = join(directory, 'dist')
  const graphPath = join(directory, BUNDLE_GRAPH_PATH)
  await mkdir(dist)
  await mkdir(dirname(graphPath), { recursive: true })
  await Promise.all(outputs.map((output) => writeFile(join(dist, output.fileName),
    output.code ?? String(output.source))))
  await writeFile(graphPath, JSON.stringify(createBundleGraph(outputs)))
  return { directory, dist, graphPath }
}

it('normalizes nested module paths and colored, URL-encoded error stacks without changing bytes', () => {
  const root = 'C:/Users/Test Owner/project'
  const evidence = { initial: { gzipBytes: 126799 }, chunks: [{
    firestoreModuleIds: [`${root}/node_modules/@firebase/firestore/index.js`],
  }], eagerControlMessage: `\u001b[31merror\u001b[0m ${root.replaceAll('/', '\\')}/vite.ts\n`
    + ` at file:///${encodeURI(root)}/node_modules/vite/index.js` }
  const normalized = normalizeBundleEvidence(evidence, root)
  expect(normalized.initial).toEqual(evidence.initial)
  expect(normalized.chunks[0].firestoreModuleIds)
    .toEqual(['<root>/node_modules/@firebase/firestore/index.js'])
  expect(normalized.eagerControlMessage)
    .toBe('error <root>/vite.ts\n at file:///<root>/node_modules/vite/index.js')
  expect(JSON.stringify(normalized)).not.toMatch(/C:|Test Owner/)
  expect(normalized.eagerControlMessage).not.toContain(String.fromCharCode(27))
})

it('rejects absent metadata from an in-memory build', () => {
  expect(() => validateBundleGraph(undefined, outputs)).toThrow('Bundle graph missing')
})

it.each(['entry.js', 'index.html'])('rejects a changed %s even when its filename is unchanged', async (file) => {
  const { dist, graphPath } = await fixture()
  await writeFile(join(dist, file), 'changed output')
  await expect(readBundleGraph(dist, graphPath)).rejects.toThrow('Bundle graph does not match current output')
})

it('rejects a graph that refers to an absent output', async () => {
  const { dist, graphPath } = await fixture()
  await rm(join(dist, 'entry.js'))
  await expect(readBundleGraph(dist, graphPath)).rejects.toThrow('Bundle graph does not match current dist')
})

it.each(['measure-bundle.mjs', 'measure-firestore-adapter.mjs'])(
  '%s fails clearly for both missing and stale graphs before measuring', async (script) => {
    const { directory, dist, graphPath } = await fixture()
    const graph = await readFile(graphPath, 'utf8')
    await rm(graphPath)
    const command = resolve('scripts', script)
    const missing = spawnSync(process.execPath, [command], { cwd: directory, encoding: 'utf8' })
    expect(missing.status).toBe(1)
    expect(missing.stderr).toContain('Bundle graph missing')
    expect(missing.stderr).toContain('Run npm run build before measuring')
    await writeFile(graphPath, graph)
    await writeFile(join(dist, 'entry.js'), 'different build, same filename')
    const stale = spawnSync(process.execPath, [command], { cwd: directory, encoding: 'utf8' })
    expect(stale.status).toBe(1)
    expect(stale.stderr).toContain('Bundle graph does not match current output')
    expect(stale.stderr).toContain('Run npm run build before measuring')
    expect(await readFile(join(dist, 'entry.js'), 'utf8')).toBe('different build, same filename')
  }, 20_000,
)
