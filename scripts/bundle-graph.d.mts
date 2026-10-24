import type { BundleOutput } from './bundle-metrics.mjs'

export interface BundleGraph {
  schemaVersion: number
  chunks: {
    fileName: string
    isEntry?: boolean
    imports?: readonly string[]
    dynamicImports?: readonly string[]
    sha256: string
    modules: string[]
  }[]
  html: { fileName: string; sha256: string }[]
}

export const BUNDLE_GRAPH_PATH: string
export function normalizeBundleEvidence<T>(value: T, root?: string): T
export function createBundleGraph(outputs: readonly BundleOutput[]): BundleGraph
export function validateBundleGraph(
  metadata: BundleGraph | undefined,
  outputs: readonly BundleOutput[],
): readonly BundleOutput[]
export function readBundleGraph(distDirectory?: string, graphPath?: string): Promise<{
  metadata: BundleGraph
  outputs: BundleOutput[]
}>
