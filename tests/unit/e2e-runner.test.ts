import { spawnSync } from 'node:child_process'
import { mkdirSync, mkdtempSync, readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { createServer } from 'node:net'
import { delimiter, join, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { expect, it } from 'vitest'
import { EMULATOR_HOST, EMULATOR_PORTS } from '../../src/lib/firebase/emulator-config'

function expectStartupFailure() {
  mkdirSync('test-results', { recursive: true })
  const fixture = mkdtempSync(resolve('test-results/runner-failure-'))
  const fakeCli = join(fixture, 'node_modules/firebase-tools/lib/bin')
  mkdirSync(fakeCli, { recursive: true })
  writeFileSync(join(fakeCli, 'firebase.js'),
    "console.error('Simulated Auth emulator startup failure'); process.exit(23)\n")

  // Isolate only the fixture child: use OS-assigned ports and never probe a real service.
  // The checked-in runner executes unchanged, including its exit/log handling.
  const preload = join(fixture, 'isolate-network.mjs')
  writeFileSync(preload, `
import { Server } from 'node:net'
const listen = Server.prototype.listen
Server.prototype.listen = function (_port, ...args) {
  return listen.call(this, 0, ...args)
}
globalThis.fetch = async () => { throw new Error('Isolated readiness probe') }
`)
  const result = spawnSync(process.execPath, [
    '--import', pathToFileURL(preload).href, resolve('scripts/run-e2e.mjs'),
  ], {
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
}

it('retains startup failure output and fails before the readiness deadline', () => {
  expectStartupFailure()
}, 20_000)

it('retains the CLI exit failure when the real Auth port is occupied', async () => {
  const listener = createServer()
  let ownsListener = false
  await new Promise<void>((ready, reject) => {
    listener.once('error', (error: NodeJS.ErrnoException) => {
      // An existing emulator also satisfies this regression case; leave it running.
      if (error.code === 'EADDRINUSE') ready()
      else reject(error)
    })
    listener.listen(EMULATOR_PORTS.auth, EMULATOR_HOST, () => {
      ownsListener = true
      ready()
    })
  })
  try {
    expectStartupFailure()
    if (ownsListener) expect(listener.listening).toBe(true)
  } finally {
    if (ownsListener) await new Promise<void>((done) => listener.close(() => done()))
  }
}, 20_000)
