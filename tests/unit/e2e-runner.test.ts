// @vitest-environment node
import { spawn, spawnSync } from 'node:child_process'
import { mkdirSync, mkdtempSync, readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { describe, expect, it } from 'vitest'
import { EMULATOR_PORTS } from '../../src/lib/firebase/emulator-config'
import { EMULATOR_STARTUP_TIMEOUT_MS, requireJava21, waitForEmulators } from '../../scripts/emulator-runner.mjs'
import type { ReadinessTiming } from '../../scripts/emulator-runner.mjs'

interface Diagnostics {
  status: string; timeoutMs: number; firstOutputMs: number | null; readyMs: number | null
  spawnedAtMs: number | null; failure?: string; exit?: { code: number | null }
  services: Record<string, { readyMs: number | null; lastProbe: string }>
  downloadActivity: { line: string }[]
  cli?: { version: string }
  debugLog?: string
  moduleTrace?: { enabled: boolean; file: string | null; overhead: string | null }
}

function fixtureRun(mode: 'exit' | 'timeout' | 'trace-pending' | 'success' | 'java-missing' | 'java-old'
  | 'cli-missing' | 'cli-mismatch' | 'collision', port?: number, trace = false) {
  const base = resolve('test-results/gate-3')
  mkdirSync(base, { recursive: true })
  const fixture = mkdtempSync(join(base, 'runner-fixture-'))
  const fakeCli = join(fixture, 'node_modules/firebase-tools/lib/bin')
  mkdirSync(fakeCli, { recursive: true })
  if (mode !== 'cli-missing') {
    writeFileSync(resolve(fakeCli, '../../package.json'), JSON.stringify({
      name: mode === 'cli-mismatch' ? 'unexpected-package' : 'firebase-tools', version: '15.34.0',
    }))
  }
  writeFileSync(join(fakeCli, 'firebase.js'), `
if (process.argv.includes('--version')) { console.error('CLI bootstrap must not discover version'); process.exit(99) }
require('./trace-fixture.cjs');
require('node:fs').writeFileSync(process.env.FIREBASE_DEBUG_PATH, 'Owned fixture debug log');
console.error('Simulated combined emulator startup');
console.log('Downloading fixture emulator');
${mode === 'exit' ? 'process.exit(23)' : 'setInterval(() => {}, 1000)'}
`)
  writeFileSync(join(fakeCli, 'trace-fixture.cjs'), mode === 'trace-pending'
    ? 'Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 30000);\n'
    : "module.exports = require('node:path').sep;\n")
  writeFileSync(join(fixture, 'firebase-debug.log'), 'Preexisting unrelated log')
  writeFileSync(join(fixture, 'firebase.json'), JSON.stringify({
    firestore: { rules: 'firestore.rules', indexes: 'firestore.indexes.json' },
  }))
  const preload = join(fixture, 'isolate-runtime.mjs')
  writeFileSync(preload, `
import childProcess from 'node:child_process';
import { syncBuiltinESMExports } from 'node:module';
import { Server } from 'node:net';
const sync = childProcess.spawnSync;
childProcess.spawnSync = (command, ...args) => command === 'java'
  ? ${mode === 'java-missing' ? "{ status:null,error:new Error('ENOENT: java fixture missing') }"
    : `{ status:0,stdout:'',stderr:'openjdk version "${mode === 'java-old' ? '17.0.1' : '21.0.12'}"' }`}
  : sync(command, ...args);
syncBuiltinESMExports();
const listen = Server.prototype.listen;
Server.prototype.listen = function (requested, ...args) {
  if (${mode === 'collision'} && requested === ${port ?? -1}) {
    queueMicrotask(() => this.emit('error', Object.assign(new Error('fixture occupied'), { code:'EADDRINUSE' })));
    return this;
  }
  return listen.call(this, 0, ...args);
};
${mode === 'timeout' || mode === 'trace-pending' ? `
const clock = Date.now(); let elapsed = 0;
Date.now = () => clock + elapsed;
const schedule = globalThis.setTimeout;
globalThis.setTimeout = (callback, ms, ...args) => {
  if (ms === 200) { elapsed += 30000; return schedule(callback, 100, ...args) }
  return schedule(callback, ms, ...args);
};` : ''}
globalThis.fetch = async (url) => {
  ${mode === 'success' ? `
  await new Promise(done => setTimeout(done, 200));
  return { status:200, json:async () => url.includes(':9099/') ? {signIn:{allowDuplicateEmails:false}} : {} };`
    : "throw new Error('Controlled readiness probe unavailable');"}
};
`)
  const harnessUrl = pathToFileURL(resolve('scripts/emulator-runner.mjs')).href
  const command = mode === 'success'
    ? ['--input-type=module', '-e', `const {startEmulatorHarness}=await import(${JSON.stringify(harnessUrl)});const h=await startEmulatorHarness();await h.stop();`]
    : [resolve('scripts/run-e2e.mjs')]
  const result = spawnSync(process.execPath, ['--import', pathToFileURL(preload).href, ...command], {
    cwd: fixture, encoding: 'utf8', windowsHide: true, timeout: 15_000,
    env: { ...process.env, TASKLY_TRACE_EMULATOR_STARTUP: String(trace),
      TASKLY_TRACE_PRIVATE_SENTINEL: 'private-tracer-fixture-value', FIREBASE_DEBUG_PATH: join(fixture, 'firebase-debug.log') },
  })
  expect(result.error).toBeUndefined()
  const directories = readdirSync(join(fixture, 'test-results/gate-3'))
    .filter((name) => name.startsWith('emulator-'))
  expect(directories).toHaveLength(1)
  const artifacts = join(fixture, 'test-results/gate-3', directories[0])
  const diagnostics = JSON.parse(readFileSync(join(artifacts, 'startup.json'), 'utf8')) as Diagnostics
  const output = readFileSync(join(artifacts, 'output.log'), 'utf8')
  return { result, diagnostics, output, artifacts, fixture }
}

describe('owned emulator runner diagnostics', () => {
  it('retains early CLI exit, first output and the generated absolute-path config', () => {
    const { result, diagnostics, output, artifacts, fixture } = fixtureRun('exit')
    expect(result.status).toBe(1)
    expect(result.stderr).toContain('exit 23')
    expect(diagnostics).toMatchObject({ status: 'failed', timeoutMs: 90_000, readyMs: null, exit: { code: 23 } })
    expect(diagnostics.firstOutputMs).toBeGreaterThanOrEqual(0)
    expect(output).toContain('Simulated combined emulator startup')
    const config = JSON.parse(readFileSync(join(artifacts, 'firebase.json'), 'utf8')) as {
      firestore: { rules: string; indexes: string }
      emulators: { auth: { port: number }; firestore: { port: number }; ui: { enabled: boolean } }
    }
    expect(config.firestore.rules).toBe(join(fixture, 'firestore.rules'))
    expect(config.firestore.indexes).toBe(join(fixture, 'firestore.indexes.json'))
    expect(config.emulators.auth.port).toBe(EMULATOR_PORTS.auth)
    expect(config.emulators.firestore.port).toBe(EMULATOR_PORTS.firestore)
    expect(config.emulators.ui.enabled).toBe(false)
  }, 20_000)

  it.each(['java-missing', 'java-old'] as const)('retains %s prerequisite failure without starting the CLI', (mode) => {
    const { result, diagnostics } = fixtureRun(mode)
    expect(result.status).toBe(1)
    expect(diagnostics.status).toBe('failed')
    expect(diagnostics.failure).toContain('Java 21 or newer is required')
    expect(diagnostics.spawnedAtMs).toBeNull()
  }, 20_000)

  it.each(['cli-missing', 'cli-mismatch'] as const)('rejects %s metadata before emulator spawn', (mode) => {
    const { result, diagnostics } = fixtureRun(mode)
    expect(result.status).toBe(1)
    expect(diagnostics.failure).toContain('Firebase CLI manifest')
    expect(diagnostics.spawnedAtMs).toBeNull()
  }, 20_000)

  it.each([EMULATOR_PORTS.auth, EMULATOR_PORTS.firestore])('refuses occupied port %s', (port) => {
    const { result, diagnostics } = fixtureRun('collision', port)
    expect(result.status).toBe(1)
    expect(diagnostics.failure).toContain(`Port ${port} is occupied`)
    expect(diagnostics.spawnedAtMs).toBeNull()
  }, 20_000)

  it('retains timeout/download evidence and leaves an unrelated process alive', async () => {
    const unrelated = spawn(process.execPath, ['-e', 'setInterval(() => {}, 1000)'], {
      windowsHide: true, stdio: 'ignore',
    })
    try {
      const { result, diagnostics, output } = fixtureRun('timeout')
      expect(result.status).toBe(1)
      expect(diagnostics.failure).toContain('shared 90000 ms deadline')
      expect(diagnostics.readyMs).toBeNull()
      expect(diagnostics.services.auth.lastProbe).toContain('Controlled readiness')
      expect(diagnostics.services.firestore.lastProbe).toContain('Controlled readiness')
      expect(output).toContain('Downloading fixture emulator')
      expect(diagnostics.downloadActivity.some((item) => item.line.includes('Downloading'))).toBe(true)
      expect(unrelated.exitCode).toBeNull()
    } finally {
      const closed = new Promise<void>((done) => unrelated.once('close', () => done()))
      unrelated.kill()
      await closed
    }
  }, 20_000)

  it('retains separate successful service readiness and output after cleanup', () => {
    const { result, diagnostics, output } = fixtureRun('success')
    expect(result.status).toBe(0)
    expect(diagnostics.status).toBe('ready')
    expect(diagnostics.cli?.version).toBe('15.34.0')
    expect(diagnostics.services.auth.readyMs).toBeGreaterThanOrEqual(0)
    expect(diagnostics.services.firestore.readyMs).toBeGreaterThanOrEqual(0)
    expect(diagnostics.firstOutputMs).toBeGreaterThanOrEqual(0)
    expect(output).toContain('Simulated combined emulator startup')
    expect(diagnostics.moduleTrace?.enabled).toBe(false)
    expect(diagnostics.moduleTrace?.file).toBeNull()
  }, 20_000)

  it('optionally traces module names/times from actual spawn and preserves unrelated debug logs', () => {
    const { result, diagnostics, fixture } = fixtureRun('success', undefined, true)
    expect(result.status).toBe(0)
    expect(diagnostics.moduleTrace?.enabled).toBe(true)
    expect(diagnostics.moduleTrace?.overhead).toContain('inside the shared deadline')
    const trace = readFileSync(diagnostics.moduleTrace!.file!, 'utf8')
    const events = trace.trim().split('\n').map((line) => JSON.parse(line) as {
      module: string; phase: string; elapsedMs: number; spawnedAtMs?: number; durationMs?: number
    })
    expect(events[0].spawnedAtMs).toBe(diagnostics.spawnedAtMs)
    expect(events.some((event) => event.phase === 'enter' && event.module === './trace-fixture.cjs')).toBe(true)
    expect(events.some((event) => event.phase === 'exit' && event.module === './trace-fixture.cjs'
      && event.durationMs! >= 0)).toBe(true)
    expect(events.every((event) => event.elapsedMs >= 0)).toBe(true)
    expect(trace).not.toContain('private-tracer-fixture-value')
    expect(trace).not.toContain('auth,firestore')
    expect(readFileSync(join(fixture, 'firebase-debug.log'), 'utf8')).toBe('Preexisting unrelated log')
    expect(readFileSync(diagnostics.debugLog!, 'utf8')).toBe('Owned fixture debug log')
  }, 20_000)

  it('retains the unfinished module entry when the shared deadline kills a blocked CLI', () => {
    const { result, diagnostics } = fixtureRun('trace-pending', undefined, true)
    expect(result.status).toBe(1)
    expect(diagnostics.failure).toContain('shared 90000 ms deadline')
    const events = readFileSync(diagnostics.moduleTrace!.file!, 'utf8').trim().split('\n')
      .map((line) => JSON.parse(line) as { phase: string; module: string })
    const moduleEvents = events.filter((event) => event.module === './trace-fixture.cjs')
    expect(moduleEvents.map((event) => event.phase)).toEqual(['enter'])
  }, 20_000)
})

describe('meaningful shared-deadline readiness', () => {
  const child = { exitCode: null, signalCode: null }
  it('probes an unreserved Firestore collection accepted by the REST API', async () => {
    let now = 0
    const collections: string[] = []
    const timing: ReadinessTiming = { spawnedAtMs: 0, timeoutMs: EMULATOR_STARTUP_TIMEOUT_MS }
    await waitForEmulators(child, timing, {
      now: () => now, delay: async () => { now += 30_000 },
      fetch: async (url) => {
        if (new URL(url).port === String(EMULATOR_PORTS.auth)) {
          return { status: 200, json: async () => ({ signIn: { allowDuplicateEmails: false } }) }
        }
        const segments = new URL(url).pathname.split('/')
        const collection = segments[segments.indexOf('documents') + 1]
        collections.push(collection)
        const reserved = /^__.*__$/.test(collection)
        return { status: reserved ? 400 : 200,
          json: async () => reserved ? { error: { status: 'INVALID_ARGUMENT' } } : {} }
      },
    })
    expect(collections.length).toBeGreaterThan(0)
    expect(collections.every((collection) => collection && !/^__.*__$/.test(collection))).toBe(true)
    expect(timing.services?.firestore.readyMs).toBe(0)
  })

  it('waits for valid Auth and Firestore API responses, not arbitrary HTTP/open ports', async () => {
    let now = 0
    const timing: ReadinessTiming = { spawnedAtMs: 0, timeoutMs: EMULATOR_STARTUP_TIMEOUT_MS }
    await waitForEmulators(child, timing, {
      now: () => now, delay: async () => { now += 1000 },
      fetch: async (url) => ({ status: 200, json: async () => url.includes(':9099/')
        ? { signIn: { allowDuplicateEmails: false } }
        : now < 2000 ? { error: { status: 'UNAVAILABLE' } } : {} }),
    })
    expect(timing.services?.auth.readyMs).toBe(0)
    expect(timing.services?.firestore.readyMs).toBe(2000)
    expect(timing.readyMs).toBe(2000)
  })

  it('does not grant Firestore another 90 seconds after Auth becomes ready', async () => {
    let now = 0
    const timing: ReadinessTiming = { spawnedAtMs: 0, timeoutMs: EMULATOR_STARTUP_TIMEOUT_MS }
    await expect(waitForEmulators(child, timing, {
      now: () => now, delay: async (ms) => { now += Math.max(ms, 30_000) },
      fetch: async (url) => ({ status: url.includes(':9099/') ? 200 : 503,
        json: async () => ({ signIn: { allowDuplicateEmails: false } }) }),
    })).rejects.toThrow('shared 90000 ms deadline')
    expect(now).toBe(90_000)
    expect(timing.services?.auth.readyMs).toBe(0)
    expect(timing.services?.firestore.readyMs).toBeNull()
  })

  it('accepts Java 21+ and rejects unparseable or incompatible versions', () => {
    expect(requireJava21('openjdk version "21.0.12"')).toBe(21)
    expect(requireJava21('java version "25"')).toBe(25)
    expect(() => requireJava21('openjdk version "17.0.1"')).toThrow('Java 21')
    expect(() => requireJava21('not a Java version')).toThrow('unknown version')
  })
})
