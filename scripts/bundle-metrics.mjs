import { posix } from 'node:path'
import { gzipSync } from 'node:zlib'

const bundleOrigin = 'https://bundle.invalid'
const javascriptFile = /\.(?:[cm]?js)$/i

/** Identify runtime SDK modules from emitted module IDs, never chunk names. */
export function isFirestoreModule(moduleId) {
  const id = moduleId.replaceAll('\\', '/').toLowerCase().replaceAll('\0', '')
  return /(?:^|\/)(?:@firebase\/firestore|firebase\/firestore)(?:\/|[?#]|$)/.test(id)
    || /(?:^|\/)(?:@?firebase_firestore)(?:[./?#]|$)/.test(id)
}

function filePath(reference, owner = '') {
  const url = new URL(reference.replaceAll('\\', '/'), `${bundleOrigin}/${owner}`)
  if (url.origin !== bundleOrigin) {
    throw new Error(`External bundle reference cannot be measured: ${reference}`)
  }
  const path = posix.normalize(decodeURIComponent(url.pathname)).replace(/^\/+/, '')
  if (!path || path.startsWith('../')) throw new Error(`Invalid bundle path: ${reference}`)
  return path
}

function moduleIds(modules) {
  return Array.isArray(modules) ? modules : Object.keys(modules ?? {})
}

function htmlReferences(source) {
  const references = []
  const html = typeof source === 'string' ? source : new TextDecoder().decode(source)
  const tags = html.replace(/<!--[\s\S]*?-->/g, '').match(/<(?:script|link)\b[^>]*>/gi) ?? []
  for (const tag of tags) {
    const attributes = new Map()
    const content = tag.replace(/^<\w+\s*/, '').replace(/\/?\s*>$/, '')
    const pattern = /([^\s=/>]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+)))?/g
    for (const match of content.matchAll(pattern)) {
      attributes.set(match[1].toLowerCase(), match[2] ?? match[3] ?? match[4] ?? '')
    }
    if (/^<script\b/i.test(tag) && attributes.get('type')?.toLowerCase() === 'module') {
      if (attributes.has('src')) references.push(attributes.get('src'))
    }
    if (/^<link\b/i.test(tag)
      && attributes.get('rel')?.toLowerCase().split(/\s+/).includes('modulepreload')) {
      if (!attributes.has('href')) throw new Error('HTML modulepreload is missing href')
      references.push(attributes.get('href'))
    }
  }
  return references
}

/**
 * Account for every emitted JS chunk and prove whether initial loading reaches Firestore.
 * Rollup imports can be output-root paths; HTML URLs are resolved relative to their document.
 * Unknown edges fail closed, including edges from deferred chunks.
 * @param {import('./bundle-metrics.mjs').BundleOutput[] | Record<string, import('./bundle-metrics.mjs').BundleOutput>} outputs
 * @param {import('./bundle-metrics.mjs').BundleOptions} [options]
 */
export function analyzeBundle(outputs, options = {}) {
  const allOutputs = Array.isArray(outputs) ? outputs : Object.values(outputs)
  const chunkMap = new Map()
  for (const output of allOutputs) {
    if (typeof output.code !== 'string' || !javascriptFile.test(filePath(output.fileName))) continue
    const fileName = filePath(output.fileName)
    if (chunkMap.has(fileName)) throw new Error(`Duplicate emitted chunk: ${fileName}`)
    chunkMap.set(fileName, { ...output, fileName })
  }
  if (!chunkMap.size) throw new Error('Bundle has no emitted JavaScript chunks')

  function resolveChunk(reference, owner = '', isHtml = false) {
    const direct = filePath(reference)
    const relative = filePath(reference, owner)
    const candidates = isHtml ? [relative] : [direct, relative]
    const match = candidates.find((candidate) => chunkMap.has(candidate))
    if (!match) throw new Error(`Missing emitted chunk: ${reference}${owner ? ` (from ${owner})` : ''}`)
    return match
  }

  const roots = new Set()
  const entryFiles = options.entryFiles
    ?? [...chunkMap.values()].filter((chunk) => chunk.isEntry).map((chunk) => chunk.fileName)
  for (const reference of [...entryFiles, ...(options.preloadFiles ?? [])]) {
    roots.add(resolveChunk(reference))
  }
  for (const output of allOutputs) {
    if (!/\.html?$/i.test(output.fileName) || output.source === undefined) continue
    for (const reference of htmlReferences(output.source)) {
      roots.add(resolveChunk(reference, filePath(output.fileName), true))
    }
  }
  if (!roots.size) throw new Error('Bundle has no JavaScript entry or preload roots')

  const staticEdges = []
  const dynamicEdges = []
  const staticImports = new Map()
  for (const chunk of chunkMap.values()) {
    const imports = [...new Set((chunk.imports ?? []).map((ref) => resolveChunk(ref, chunk.fileName)))]
    staticImports.set(chunk.fileName, imports)
    for (const to of imports) staticEdges.push({ from: chunk.fileName, to })
    for (const to of new Set((chunk.dynamicImports ?? []).map((ref) => resolveChunk(ref, chunk.fileName)))) {
      dynamicEdges.push({ from: chunk.fileName, to })
    }
  }

  const initialFiles = new Set()
  const pending = [...roots]
  while (pending.length) {
    const file = pending.pop()
    if (initialFiles.has(file)) continue
    initialFiles.add(file)
    pending.push(...staticImports.get(file))
  }

  const predicate = options.isFirestoreModule ?? isFirestoreModule
  const chunks = [...chunkMap.values()].sort((a, b) => a.fileName.localeCompare(b.fileName))
    .map((chunk) => {
      const firestoreModuleIds = moduleIds(chunk.modules).filter(predicate).sort()
      return {
        fileName: chunk.fileName,
        rawBytes: Buffer.byteLength(chunk.code),
        gzipBytes: gzipSync(chunk.code).byteLength,
        initial: initialFiles.has(chunk.fileName),
        firestore: firestoreModuleIds.length > 0,
        firestoreModuleIds,
      }
    })
  function sum(selected) {
    return {
      rawBytes: selected.reduce((bytes, chunk) => bytes + chunk.rawBytes, 0),
      gzipBytes: selected.reduce((bytes, chunk) => bytes + chunk.gzipBytes, 0),
      files: selected.map((chunk) => chunk.fileName),
    }
  }
  const firestoreChunks = chunks.filter((chunk) => chunk.firestore).map((chunk) => chunk.fileName)
  const initialFirestoreChunks = chunks.filter((chunk) => chunk.initial && chunk.firestore)
    .map((chunk) => chunk.fileName)
  const edgeOrder = (a, b) => a.from.localeCompare(b.from) || a.to.localeCompare(b.to)
  return {
    chunks,
    roots: [...roots].sort(),
    staticEdges: staticEdges.sort(edgeOrder),
    dynamicEdges: dynamicEdges.sort(edgeOrder),
    initial: sum(chunks.filter((chunk) => chunk.initial)),
    deferred: sum(chunks.filter((chunk) => !chunk.initial)),
    total: sum(chunks),
    firestoreChunks,
    initialFirestoreChunks,
    boundaryPassed: initialFirestoreChunks.length === 0,
  }
}
