import { createHash } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { stripVTControlCharacters } from 'node:util'

export const BUNDLE_GRAPH_PATH = 'test-results/gate-3/bundle-graph.json'
const rebuild = 'Run npm run build before measuring.'
const hash = (source) => createHash('sha256').update(source).digest('hex')

/** Strip terminal formatting and local checkout paths from recorded evidence. */
export function normalizeBundleEvidence(value, root = process.cwd()) {
  if (typeof value === 'string') {
    const normalizedRoot = root.replaceAll('\\', '/')
    return stripVTControlCharacters(value).replaceAll('\\', '/')
      .replaceAll(encodeURI(normalizedRoot), '<root>').replaceAll(normalizedRoot, '<root>')
  }
  if (Array.isArray(value)) return value.map((item) => normalizeBundleEvidence(item, root))
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([key, item]) =>
      [key, normalizeBundleEvidence(item, root)]))
  }
  return value
}

export function createBundleGraph(outputs) {
  return {
    schemaVersion: 2,
    chunks: outputs.filter((output) => typeof output.code === 'string').map((chunk) => ({
      fileName: chunk.fileName, isEntry: chunk.isEntry,
      imports: chunk.imports, dynamicImports: chunk.dynamicImports,
      sha256: hash(chunk.code),
      modules: normalizeBundleEvidence(Array.isArray(chunk.modules)
        ? chunk.modules : Object.keys(chunk.modules ?? {})),
    })),
    html: outputs.filter((output) => output.fileName.endsWith('.html') && output.source !== undefined)
      .map((asset) => ({ fileName: asset.fileName, sha256: hash(asset.source) })),
  }
}

function checkSchema(metadata) {
  if (!metadata) throw new Error(`Bundle graph missing. ${rebuild}`)
  if (metadata.schemaVersion !== 2 || !Array.isArray(metadata.chunks)
    || !metadata.chunks.length || !Array.isArray(metadata.html)) {
    throw new Error(`Invalid bundle graph. ${rebuild}`)
  }
}

/** Validate both in-memory builds and the saved graph against their actual output. */
export function validateBundleGraph(metadata, outputs) {
  checkSchema(metadata)
  const actual = createBundleGraph(outputs)
  for (const kind of ['chunks', 'html']) {
    const expected = metadata[kind]
    if (expected.length !== actual[kind].length || expected.some((asset) =>
      !actual[kind].some((item) => item.fileName === asset.fileName && item.sha256 === asset.sha256))) {
      throw new Error(`Bundle graph does not match current output (${kind}). ${rebuild}`)
    }
  }
  return outputs
}

export async function readBundleGraph(distDirectory = 'dist', graphPath = BUNDLE_GRAPH_PATH) {
  let metadata
  try {
    metadata = JSON.parse(await readFile(graphPath, 'utf8'))
  } catch (error) {
    const reason = error.code === 'ENOENT' ? 'missing' : 'unreadable'
    throw new Error(`Bundle graph ${reason} at ${graphPath}. ${rebuild}`, { cause: error })
  }
  checkSchema(metadata)
  let outputs
  try {
    outputs = await Promise.all([
      ...metadata.chunks.map(async (chunk) => ({
        ...chunk, code: await readFile(join(distDirectory, chunk.fileName), 'utf8'),
      })),
      ...metadata.html.map(async (asset) => ({
        ...asset, source: await readFile(join(distDirectory, asset.fileName), 'utf8'),
      })),
    ])
  } catch (error) {
    throw new Error(`Bundle graph does not match current dist: an output is missing or unreadable. ${rebuild}`,
      { cause: error })
  }
  validateBundleGraph(metadata, outputs)
  return { metadata, outputs }
}
