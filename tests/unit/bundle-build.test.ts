// @vitest-environment node
import { createHash } from 'node:crypto'
import { mkdtemp, readFile, readdir, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { build, type Plugin } from 'vite'
import { afterEach, expect, it } from 'vitest'
import { bundleGraphPlugin } from '../../vite.config'
import { analyzeBundle } from '../../scripts/bundle-metrics.mjs'
import { readBundleGraph } from '../../scripts/bundle-graph.mjs'

const entryRequest = '/__taskly_bundle_guard_entry__.js'
const entryId = '\0taskly:bundle-guard-entry'
const sdkRequest = 'taskly:bundle-guard-sdk'
const sdkId = '/bundle-guard/node_modules/@firebase/firestore/index.js'

const directories: string[] = []
afterEach(async () => { await Promise.all(directories.splice(0).map((directory) =>
  rm(directory, { recursive: true, force: true }))) })

async function buildFixture(strategy: 'lazy' | 'static' | 'preload', directory?: string) {
  const boundary = bundleGraphPlugin(directory ? { graphPath: join(directory, 'bundle-graph.json') } : {})
  const fixture: Plugin = {
    name: 'taskly-bundle-guard-fixture',
    transformIndexHtml: {
      order: 'pre',
      handler: () => `<html><head></head><body><script type="module" src="${entryRequest}"></script></body></html>`,
    },
    resolveId(id) {
      if (id === entryRequest) return entryId
      if (id === sdkRequest) return sdkId
    },
    load(id) {
      if (id === sdkId) return 'export const sdk = () => "fixture-only";'
      if (id !== entryId) return
      return strategy === 'static'
        ? `import { sdk } from '${sdkRequest}'; globalThis.__tasklyBundleProbe = sdk;`
        : `globalThis.__tasklyBundleProbe = () => import('${sdkRequest}');`
    },
  }
  const preload: Plugin = {
    name: 'taskly-bundle-guard-preload-fixture',
    transformIndexHtml: {
      order: 'post',
      handler(html, context) {
        if (strategy !== 'preload') return html
        if (!context.bundle) throw new Error('Expected emitted HTML bundle context')
        const sdkChunk = Object.values(context.bundle).find((output) =>
          output.type === 'chunk' && Object.keys(output.modules).includes(sdkId))
        if (!sdkChunk) throw new Error('Expected emitted deferred SDK chunk')
        return { html, tags: [{
          tag: 'link', attrs: { rel: 'modulepreload', href: `/${sdkChunk.fileName}` }, injectTo: 'head',
        }] }
      },
    },
  }
  const result = await build({
    configFile: false,
    publicDir: false,
    logLevel: 'silent',
    plugins: [fixture, preload, boundary],
    build: { write: !!directory, outDir: directory ? join(directory, 'dist') : undefined,
      reportCompressedSize: false },
  })
  const outputs = (Array.isArray(result) ? result : [result]).flatMap((output) => {
    if (!('output' in output)) throw new Error('Expected completed build, received a watcher')
    return output.output
  })
  const metadata = boundary.api?.getGraph()
  if (!metadata) throw new Error('Expected private bundle graph metadata')
  return { outputs, metadata }
}

it('guards actual Vite HTML and records every emitted chunk after final rendering', async () => {
  const { outputs, metadata } = await buildFixture('lazy')
  expect(outputs.some((output) => output.fileName === 'bundle-graph.json')).toBe(false)
  const graph = analyzeBundle(outputs)
  const sdkChunk = metadata.chunks.find((chunk) => chunk.modules.includes(sdkId))
  expect(sdkChunk).toBeDefined()
  expect(metadata.schemaVersion).toBe(2)
  expect(metadata.html).toEqual([{ fileName: 'index.html', sha256: expect.any(String) }])
  expect(metadata.chunks.map((chunk) => chunk.fileName).sort())
    .toEqual(outputs.filter((output) => output.type === 'chunk').map((chunk) => chunk.fileName).sort())
  for (const chunk of metadata.chunks) {
    const emitted = outputs.find((output) => output.fileName === chunk.fileName)
    if (!emitted || emitted.type !== 'chunk') throw new Error(`Missing final chunk ${chunk.fileName}`)
    expect(chunk.sha256).toBe(createHash('sha256').update(emitted.code).digest('hex'))
    expect(chunk.imports).toEqual(emitted.imports)
    expect(chunk.dynamicImports).toEqual(emitted.dynamicImports)
  }
  expect(graph.boundaryPassed).toBe(true)
  expect(graph.initial.files).not.toContain(sdkChunk!.fileName)
  expect(graph.deferred.files).toContain(sdkChunk!.fileName)
  expect(graph.dynamicEdges.some((edge) => edge.to === sdkChunk!.fileName)).toBe(true)
}, 20_000)

it('writes the graph outside the served build and validates its chunk and HTML hashes', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'taskly-private-graph-'))
  directories.push(directory)
  const { outputs, metadata } = await buildFixture('lazy', directory)
  const dist = join(directory, 'dist')
  expect(await readdir(dist)).not.toContain('bundle-graph.json')
  expect(outputs.some((output) => output.fileName === 'bundle-graph.json')).toBe(false)
  const saved = await readBundleGraph(dist, join(directory, 'bundle-graph.json'))
  expect(saved.metadata).toEqual(metadata)
  expect(analyzeBundle(saved.outputs).boundaryPassed).toBe(true)
  expect(metadata.html[0].sha256).toBe(createHash('sha256')
    .update(await readFile(join(dist, 'index.html'))).digest('hex'))
}, 20_000)

it.each(['static', 'preload'] as const)(
  'rejects a real emitted %s SDK graph, including HTML post-transform preloads', async (strategy) => {
    await expect(buildFixture(strategy)).rejects.toThrow('Firestore runtime reaches initial JavaScript:')
  }, 20_000,
)
