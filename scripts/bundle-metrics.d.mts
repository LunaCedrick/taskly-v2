export interface BundleOutput {
  fileName: string
  code?: string
  source?: string | Uint8Array
  isEntry?: boolean
  imports?: readonly string[]
  dynamicImports?: readonly string[]
  modules?: Record<string, unknown> | readonly string[]
}

export interface BundleOptions {
  entryFiles?: readonly string[]
  preloadFiles?: readonly string[]
  isFirestoreModule?: (moduleId: string) => boolean
}

export interface BundleChunkMetrics {
  fileName: string
  rawBytes: number
  gzipBytes: number
  initial: boolean
  firestore: boolean
  firestoreModuleIds: string[]
}

export interface BundleTotals {
  rawBytes: number
  gzipBytes: number
  files: string[]
}

export interface BundleEdge {
  from: string
  to: string
}

export interface BundleMetrics {
  chunks: BundleChunkMetrics[]
  roots: string[]
  staticEdges: BundleEdge[]
  dynamicEdges: BundleEdge[]
  initial: BundleTotals
  deferred: BundleTotals
  total: BundleTotals
  firestoreChunks: string[]
  initialFirestoreChunks: string[]
  boundaryPassed: boolean
}

export function isFirestoreModule(moduleId: string): boolean
export function analyzeBundle(
  outputs: readonly BundleOutput[] | Record<string, BundleOutput>,
  options?: BundleOptions,
): BundleMetrics
