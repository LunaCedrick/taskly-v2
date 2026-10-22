// @vitest-environment node
import { gzipSync } from 'node:zlib'
import { describe, expect, it } from 'vitest'
import { analyzeBundle, isFirestoreModule } from '../../scripts/bundle-metrics.mjs'
import type { BundleOutput } from '../../scripts/bundle-metrics.mjs'

function chunk(fileName: string, extra: Partial<BundleOutput> = {}): BundleOutput {
  return { fileName, code: `export const value = ${JSON.stringify(fileName)};`, ...extra }
}

const sdkModules = { '/repo/node_modules/@firebase/firestore/dist/index.esm.js': {} }

describe('bundle graph accounting', () => {
  it('deduplicates shared static chunks and counts every emitted byte', () => {
    const outputs = [
      chunk('assets/main.js', { isEntry: true, imports: ['assets/a.js', 'assets/b.js'] }),
      chunk('assets/a.js', { imports: ['assets/shared.js'] }),
      chunk('assets/b.js', { imports: ['assets/shared.js'] }),
      chunk('assets/shared.js', { code: 'export const message = "你好 🌱";', imports: ['assets/a.js'] }),
      chunk('assets/deferred.js'),
    ]
    const result = analyzeBundle(outputs)
    const raw = outputs.map((output) => Buffer.byteLength(output.code!))
    const gzip = outputs.map((output) => gzipSync(output.code!).byteLength)
    expect(result.initial.files).toHaveLength(4)
    expect(result.deferred.files).toEqual(['assets/deferred.js'])
    expect(result.initial.rawBytes).toBe(raw.slice(0, 4).reduce((a, b) => a + b, 0))
    expect(result.initial.gzipBytes).toBe(gzip.slice(0, 4).reduce((a, b) => a + b, 0))
    expect(result.total.rawBytes).toBe(raw.reduce((a, b) => a + b, 0))
    expect(result.total.gzipBytes).toBe(gzip.reduce((a, b) => a + b, 0))
    expect(result.initial.gzipBytes + result.deferred.gzipBytes).toBe(result.total.gzipBytes)
    expect(result.initial.rawBytes + result.deferred.rawBytes).toBe(result.total.rawBytes)
    expect(result.chunks).toHaveLength(5)
    expect(result.chunks.find((item) => item.fileName === 'assets/deferred.js'))
      .toMatchObject({ rawBytes: raw[4], gzipBytes: gzip[4], initial: false })
  })

  it('keeps a dynamic SDK graph deferred and reports actual module ID evidence', () => {
    const result = analyzeBundle([
      chunk('entry.js', { isEntry: true, dynamicImports: ['adapter.js'] }),
      chunk('adapter.js', { imports: ['ordinary-name.js'] }),
      chunk('ordinary-name.js', { modules: sdkModules }),
    ])
    expect(result.boundaryPassed).toBe(true)
    expect(result.initial.files).toEqual(['entry.js'])
    expect(result.firestoreChunks).toEqual(['ordinary-name.js'])
    expect(result.initialFirestoreChunks).toEqual([])
    expect(result.dynamicEdges).toEqual([{ from: 'entry.js', to: 'adapter.js' }])
    expect(result.staticEdges).toEqual([{ from: 'adapter.js', to: 'ordinary-name.js' }])
    expect(result.chunks[2].firestoreModuleIds).toEqual(Object.keys(sdkModules))
  })

  it.each(['direct', 're-export', 'shared', 'preloaded'])(
    'fails when %s loading reaches an SDK chunk regardless of its filename', (kind) => {
      const entryImports = kind === 'direct' ? ['ordinary.js']
        : kind === 're-export' ? ['barrel.js'] : kind === 'shared' ? ['shared.js'] : []
      const result = analyzeBundle([
        chunk('entry.js', { isEntry: true, imports: entryImports, dynamicImports: ['adapter.js'] }),
        chunk('barrel.js', { code: 'export * from "./ordinary.js";', imports: ['ordinary.js'] }),
        chunk('shared.js', { imports: ['ordinary.js'] }),
        chunk('adapter.js', { imports: ['shared.js'] }),
        chunk('ordinary.js', { modules: sdkModules }),
      ], { preloadFiles: kind === 'preloaded' ? ['ordinary.js'] : [] })
      expect(result.boundaryPassed).toBe(false)
      expect(result.initialFirestoreChunks).toEqual(['ordinary.js'])
    },
  )

  it('does not infer a runtime SDK from source text, type-only imports, or chunk filenames', () => {
    const result = analyzeBundle([
      chunk('firestore-hash.js', {
        isEntry: true,
        code: '// import type { Firestore } from "firebase/firestore";\nexport const count = 1;',
        modules: { '/repo/src/types.ts': {} },
      }),
    ])
    expect(result.boundaryPassed).toBe(true)
    expect(result.firestoreChunks).toEqual([])
  })

  it('resolves HTML entry scripts and preloads through their static closure', () => {
    const result = analyzeBundle([
      { fileName: 'index.html', source: `
        <!-- <link rel="modulepreload" href="missing.js"> -->
        <script type='module' src='/assets/main.js?v=2#entry'></script>
        <link crossorigin href="/assets/preload.js?x=1&amp;y=2" rel="MODULEPRELOAD">
        <link rel="stylesheet" href="styles.css">
      ` },
      chunk('assets/main.js', { dynamicImports: ['./sdk.js'] }),
      chunk('assets/preload.js', { imports: ['./bridge.js'] }),
      chunk('assets/bridge.js', { imports: ['assets/sdk.js'] }),
      chunk('assets/sdk.js', { modules: sdkModules }),
    ])
    expect(result.roots).toEqual(['assets/main.js', 'assets/preload.js'])
    expect(result.initial.files).toHaveLength(4)
    expect(result.boundaryPassed).toBe(false)
    expect(result.initialFirestoreChunks).toEqual(['assets/sdk.js'])
  })

  it('uses the HTML document directory for relative script URLs', () => {
    const result = analyzeBundle([
      { fileName: 'nested/index.html', source: '<script type=module src="./entry.js"></script>' },
      chunk('nested/entry.js'), chunk('entry.js'),
    ])
    expect(result.initial.files).toEqual(['nested/entry.js'])
    expect(result.deferred.files).toEqual(['entry.js'])
  })

  it('allows a custom entry graph instead of marking all entry chunks initial', () => {
    const result = analyzeBundle([
      chunk('main.js', { isEntry: true }),
      chunk('measurement.js', { isEntry: true, dynamicImports: ['sdk.js'] }),
      chunk('sdk.js', { modules: sdkModules }),
    ], { entryFiles: ['/measurement.js?entry=1'] })
    expect(result.roots).toEqual(['measurement.js'])
    expect(result.initial.files).toEqual(['measurement.js'])
    expect(result.deferred.files).toEqual(['main.js', 'sdk.js'])
    expect(result.boundaryPassed).toBe(true)
  })

  it('supports module ID arrays and an explicit runtime detector', () => {
    const result = analyzeBundle({ entry: chunk('entry.js', { isEntry: true, modules: ['custom-sdk'] }) }, {
      isFirestoreModule: (id) => id === 'custom-sdk',
    })
    expect(result.boundaryPassed).toBe(false)
    expect(result.chunks[0].firestoreModuleIds).toEqual(['custom-sdk'])
  })

  it.each(['imports', 'dynamicImports'] as const)('rejects missing %s chunks', (edge) => {
    expect(() => analyzeBundle([
      chunk('entry.js', { isEntry: true, [edge]: ['missing.js'] }),
    ])).toThrow('Missing emitted chunk: missing.js')
  })

  it('checks missing edges even in otherwise unreachable deferred chunks', () => {
    expect(() => analyzeBundle([
      chunk('entry.js', { isEntry: true }), chunk('deferred.js', { imports: ['missing.js'] }),
    ])).toThrow('Missing emitted chunk: missing.js')
  })

  it('rejects missing preload roots, external URLs, and unknown HTML dependencies', () => {
    const entry = chunk('entry.js', { isEntry: true })
    expect(() => analyzeBundle([entry], { preloadFiles: ['missing.js'] })).toThrow('Missing emitted chunk')
    expect(() => analyzeBundle([entry], { preloadFiles: ['https://example.com/sdk.js'] }))
      .toThrow('External bundle reference cannot be measured')
    expect(() => analyzeBundle([
      entry, { fileName: 'index.html', source: '<link rel=modulepreload href="/missing.js">' },
    ])).toThrow('Missing emitted chunk')
  })

  it('rejects missing roots and duplicate output paths', () => {
    expect(() => analyzeBundle([chunk('entry.js')])).toThrow('no JavaScript entry')
    expect(() => analyzeBundle([chunk('entry.js'), chunk('entry.js')])).toThrow('Duplicate emitted chunk')
  })
})

describe('Firestore runtime module detection', () => {
  it.each([
    'firebase/firestore', 'firebase/firestore/lite', '@firebase/firestore',
    '/repo/node_modules/firebase/firestore/dist/esm/index.esm.js',
    'C:\\repo\\node_modules\\@firebase\\firestore\\dist\\index.esm.js',
    '/repo/node_modules/.vite/deps/firebase_firestore.js?v=123',
    '\0firebase_firestore',
  ])('recognizes %s', (id) => expect(isFirestoreModule(id)).toBe(true))

  it.each([
    '/repo/src/firestore.ts', 'assets/firestore-SDK.js', '@firebase/auth',
    '/repo/node_modules/firebase/auth/dist/index.js', '@firebase/firestore-types',
  ])('does not mistake %s for runtime SDK code', (id) => expect(isFirestoreModule(id)).toBe(false))
})
