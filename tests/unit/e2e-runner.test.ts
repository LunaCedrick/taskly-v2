import { spawnSync } from 'node:child_process'
import { mkdirSync, mkdtempSync, readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { delimiter, join, resolve } from 'node:path'
import { expect, it } from 'vitest'

it('retains startup failure output and fails before the readiness deadline', () => {
  mkdirSync('test-results', { recursive: true })
  const fixture = mkdtempSync(resolve('test-results/runner-failure-'))
  const fakeCli = join(fixture, 'node_modules/firebase-tools/lib/bin')
  mkdirSync(fakeCli, { recursive: true })
  writeFileSync(join(fakeCli, 'firebase.js'),
    "console.error('Simulated Auth emulator startup failure'); process.exit(23)\n")

  const result = spawnSync(process.execPath, [resolve('scripts/run-e2e.mjs')], {
    cwd: fixture, encoding: 'utf8', windowsHide: true, timeout: 15_000,
    env: { ...process.env, PATH: `${fixture}${delimiter}${process.env.PATH ?? ''}` },
  })
  expect(result.error).toBeUndefined()
  expect(result.status).toBe(1)
  expect(result.stderr).toContain('exit 23')
  expect(result.stderr).toContain('Simulated Auth emulator startup failure')

  const directory = readdirSync(join(fixture, 'test-results'))
    .find((name) => name.startsWith('auth-emulator-'))!
  const artifacts = join(fixture, 'test-results', directory)
  const startup = JSON.parse(readFileSync(join(artifacts, 'startup.json'), 'utf8')) as {
    status: string; timeoutMs: number; firstOutputMs: number; readyMs: number | null
  }
  expect(startup.status).toBe('failed')
  expect(startup.timeoutMs).toBe(90_000)
  expect(startup.firstOutputMs).toBeGreaterThanOrEqual(0)
  expect(startup.readyMs).toBeNull()
  expect(readFileSync(join(artifacts, 'output.log'), 'utf8'))
    .toContain('Simulated Auth emulator startup failure')
}, 20_000)
