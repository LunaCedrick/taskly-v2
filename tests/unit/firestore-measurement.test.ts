// @vitest-environment node
import { execFile, execFileSync } from 'node:child_process'
import { cp, mkdir, mkdtemp, readFile, rm, stat, symlink, unlink, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { basename, dirname, join, resolve } from 'node:path'
import { promisify } from 'node:util'
import { expect, it } from 'vitest'

const execute = promisify(execFile)

it('runs the real adapter measurement with no test-results/gate-2 or prior dist', async () => {
  const root = process.cwd()
  const directory = await mkdtemp(join(tmpdir(), 'taskly-adapter-clean-'))
  if (dirname(resolve(directory)) !== resolve(tmpdir()) || !basename(directory).startsWith('taskly-adapter-clean-')) {
    throw new Error('Refusing a fixture outside the adapter measurement temp directory')
  }
  const modules = join(directory, 'node_modules')
  let linked = false
  try {
    // Copy current sources, not HEAD, so this regression exercises uncommitted script fixes too.
    for (const file of ['scripts', 'src', 'public', 'index.html', 'vite.config.ts', 'package.json']) {
      await cp(resolve(file), join(directory, file), { recursive: true })
    }
    await mkdir(join(directory, 'docs/qa/gate-1'), { recursive: true })
    await cp(resolve('docs/qa/gate-1/bundle.json'), join(directory, 'docs/qa/gate-1/bundle.json'))
    // The harness only reads frozen git objects; no checkout/index operation touches this gitdir.
    const gitdir = execFileSync('git', ['rev-parse', '--absolute-git-dir'], { cwd: root, encoding: 'utf8' }).trim()
    await writeFile(join(directory, '.git'), `gitdir: ${gitdir}\n`)
    await symlink(resolve('node_modules'), modules, process.platform === 'win32' ? 'junction' : 'dir')
    linked = true
    await expect(stat(join(directory, 'test-results/gate-2'))).rejects.toMatchObject({ code: 'ENOENT' })
    await expect(stat(join(directory, 'dist'))).rejects.toMatchObject({ code: 'ENOENT' })
    const result = await execute(process.execPath, ['scripts/measure-firestore-adapter.mjs'], {
      cwd: directory, timeout: 60_000, windowsHide: true,
    })
    expect(JSON.parse(result.stdout)).toMatchObject({ passed: true, eagerControlRejected: true })
    const evidence = JSON.parse(await readFile(join(directory, 'test-results/gate-2/firestore-adapter-bundle.json'), 'utf8'))
    expect(evidence.passed).toBe(true)
    for (const variant of [evidence.baseline, evidence.adapterOnly, evidence.extendedAdapterOnly]) {
      expect(variant.boundaryPassed).toBe(true)
      expect(variant.initial.gzipBytes).toBeLessThan(200_000)
      expect(variant.moduleEvidence.length).toBeGreaterThan(0)
    }
    await expect(stat(join(directory, 'test-results/gate-2/bundle-graph.json'))).rejects.toMatchObject({ code: 'ENOENT' })
    await expect(stat(join(directory, 'dist'))).rejects.toMatchObject({ code: 'ENOENT' })
  } finally {
    // Remove the dependency junction first; recursive cleanup is confined to this named temp fixture.
    if (linked) await unlink(modules)
    await rm(directory, { recursive: true, force: true })
  }
}, 90_000)
