import react from '@vitejs/plugin-react'
import { mkdir, writeFile } from 'node:fs/promises'
import { dirname } from 'node:path'
import { defineConfig, type Plugin } from 'vite'
import { analyzeBundle } from './scripts/bundle-metrics.mjs'
import { BUNDLE_GRAPH_PATH, createBundleGraph, validateBundleGraph } from './scripts/bundle-graph.mjs'
import type { BundleGraph } from './scripts/bundle-graph.mjs'

export function bundleGraphPlugin({ graphPath = BUNDLE_GRAPH_PATH } = {}): Plugin<{
  getGraph: () => BundleGraph | undefined
}> {
  let graph: BundleGraph | undefined
  return {
    name: 'taskly-bundle-graph',
    enforce: 'post',
    api: { getGraph: () => graph },
    buildStart() { graph = undefined },
    generateBundle: { order: 'post', handler(_options, bundle) {
      const outputs = Object.values(bundle)
      const metrics = analyzeBundle(outputs)
      if (!metrics.boundaryPassed) {
        this.error(`Firestore runtime reaches initial JavaScript: ${metrics.initialFirestoreChunks.join(', ')}`)
      }
      graph = createBundleGraph(outputs)
    } },
    async writeBundle(_options, bundle) {
      validateBundleGraph(graph, Object.values(bundle))
      await mkdir(dirname(graphPath), { recursive: true })
      await writeFile(graphPath, JSON.stringify(graph) + '\n')
    },
  }
}

export default defineConfig(({ mode }) => ({
  plugins: [react(), bundleGraphPlugin(mode === 'e2e'
    ? { graphPath: 'test-results/gate-3/e2e-bundle-graph.json' } : {})],
}))
