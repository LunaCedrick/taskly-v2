import react from '@vitejs/plugin-react'
import { createHash } from 'node:crypto'
import { defineConfig, type Plugin } from 'vite'
import { analyzeBundle } from './scripts/bundle-metrics.mjs'

export function bundleGraphPlugin(): Plugin {
  return {
    name: 'taskly-bundle-graph',
    enforce: 'post',
    generateBundle: { order: 'post', handler(_options, bundle) {
      const outputs = Object.values(bundle)
      const metrics = analyzeBundle(outputs)
      if (!metrics.boundaryPassed) {
        this.error(`Firestore runtime reaches initial JavaScript: ${metrics.initialFirestoreChunks.join(', ')}`)
      }
      const root = process.cwd().replaceAll('\\', '/')
      const chunks = outputs.filter((output) => output.type === 'chunk').map((chunk) => ({
        fileName: chunk.fileName, isEntry: chunk.isEntry,
        imports: chunk.imports, dynamicImports: chunk.dynamicImports,
        sha256: createHash('sha256').update(chunk.code).digest('hex'),
        modules: Object.keys(chunk.modules).map((id) => id.replaceAll('\\', '/').replaceAll(root, '<root>')),
      }))
      const html = outputs.filter((output) => output.type === 'asset' && output.fileName.endsWith('.html'))
        .map((output) => ({ fileName: output.fileName }))
      this.emitFile({ type: 'asset', fileName: 'bundle-graph.json',
        source: JSON.stringify({ schemaVersion: 1, chunks, html }) + '\n' })
    } },
  }
}

export default defineConfig({
  plugins: [react(), bundleGraphPlugin()],
})
