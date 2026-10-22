// @vitest-environment node
import { createHash } from 'node:crypto'
import { build, type Plugin } from 'vite'
import { expect, it } from 'vitest'
import { bundleGraphPlugin } from '../../vite.config'
import { analyzeBundle } from '../../scripts/bundle-metrics.mjs'

const entryRequest = '/__taskly_bundle_guard_entry__.js'
const entryId = '\0taskly:bundle-guard-entry'
const sdkRequest = 'taskly:bundle-guard-sdk'
const sdkId = '/bundle-guard/node_modules/@firebase/firestore/index.js'

interface GraphMetadata {
  schemaVersion: number
  chunks: {
    fileName: string
    imports: string[]
    dynamicImports: string[]
    modules: string[]
    sha256: string
  }[]
  html: { fileName: string }[]
}

async function buildFixture(strategy: 'lazy' | 'static' | 'preload') {
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
    plugins: [fixture, preload, bundleGraphPlugin()],
    build: { write: false, reportCompressedSize: false },
  })
  return (Array.isArray(result) ? result : [result]).flatMap((output) => {
    if (!('output' in output)) throw new Error('Expected completed build, received a watcher')
    return output.output
  })
}

it('guards actual Vite HTML and records every emitted chunk after final rendering', async () => {
  const outputs = await buildFixture('lazy')
  const asset = outputs.find((output) => output.type === 'asset' && output.fileName === 'bundle-graph.json')
  if (!asset || asset.type !== 'asset') throw new Error('Expected bundle graph metadata')
  const metadata = JSON.parse(String(asset.source)) as GraphMetadata
  const graph = analyzeBundle(outputs)
  const sdkChunk = metadata.chunks.find((chunk) => chunk.modules.includes(sdkId))
  expect(sdkChunk).toBeDefined()
  expect(metadata.schemaVersion).toBe(1)
  expect(metadata.html).toEqual([{ fileName: 'index.html' }])
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

it.each(['static', 'preload'] as const)(
  'rejects a real emitted %s SDK graph, including HTML post-transform preloads', async (strategy) => {
    await expect(buildFixture(strategy)).rejects.toThrow('Firestore runtime reaches initial JavaScript:')
  }, 20_000,
)
