import { spawn } from 'node:child_process'
import { appendFileSync, existsSync } from 'node:fs'
import { copyFile, mkdir, mkdtemp, writeFile } from 'node:fs/promises'
import { createServer } from 'node:net'
import { tmpdir } from 'node:os'
import { delimiter, join, resolve } from 'node:path'
import { EMULATOR_HOST, EMULATOR_PORTS, EMULATOR_PROJECT_ID } from '../src/lib/firebase/emulator-config.ts'

const root = process.cwd()
const appPort = 4173
const appUrl = `http://${EMULATOR_HOST}:${appPort}`
const emulatorUrl = `http://${EMULATOR_HOST}:${EMULATOR_PORTS.auth}`
const children = new Set()
let startup
const args = process.argv.slice(2).filter((argument) => argument !== '--record-evidence')
const environment = {
  ...process.env, CI: 'true', FIREBASE_CLI_DISABLE_UPDATE_CHECK: 'true',
  TASKLY_E2E_MANAGED: 'true',
  TASKLY_RECORD_EVIDENCE: String(process.argv.includes('--record-evidence')),
  VITE_USE_AUTH_EMULATOR: 'true',
  VITE_FIREBASE_API_KEY: 'fake-api-key', VITE_FIREBASE_AUTH_DOMAIN: 'localhost',
  VITE_FIREBASE_PROJECT_ID: EMULATOR_PROJECT_ID,
  VITE_FIREBASE_STORAGE_BUCKET: '', VITE_FIREBASE_MESSAGING_SENDER_ID: '123456789',
  VITE_FIREBASE_APP_ID: '1:123456789:web:emulator',
}

function start(script, args, options = {}) {
  const child = spawn(process.execPath, [script, ...args], {
    cwd: root, env: environment, windowsHide: true, stdio: 'inherit', ...options,
  })
  children.add(child)
  child.once('error', (error) => { child.startError = error })
  child.once('close', () => children.delete(child))
  return child
}

function completed(child) {
  return new Promise((resolveResult, reject) => {
    child.once('error', reject)
    child.once('close', (code) => code === 0 ? resolveResult() : reject(new Error(`Process exited ${code}`)))
  })
}

async function assertFree(port) {
  const server = createServer()
  await new Promise((ready, reject) => {
    server.once('error', () => reject(new Error(`Port ${port} is occupied; no existing service will be reused`)))
    server.listen(port, EMULATOR_HOST, ready)
  })
  await new Promise((done) => server.close(done))
}

async function ready(url, child) {
  const started = Date.now()
  const deadline = started + 90_000
  let lastProbe = 'No response'
  while (Date.now() < deadline) {
    if (child.startError) throw child.startError
    if (child.exitCode !== null || child.signalCode !== null) {
      throw new Error(`Service exited before ${url} was ready (exit ${child.exitCode}, signal ${child.signalCode})`)
    }
    try {
      const response = await fetch(url, { signal: AbortSignal.timeout(1000) })
      lastProbe = `HTTP ${response.status}`
      if (response.status < 500) return Date.now() - started
    } catch (error) {
      lastProbe = error.cause?.code ?? error.message
    }
    await new Promise((done) => setTimeout(done, 200))
  }
  throw new Error(`Service did not start: ${url} after ${Date.now() - started} ms; last probe: ${lastProbe}`)
}

function captureEmulator(child, directory) {
  const output = join(directory, 'output.log')
  for (const [stream, destination, label] of [
    [child.stdout, process.stdout, 'stdout'], [child.stderr, process.stderr, 'stderr'],
  ]) {
    stream.on('data', (chunk) => {
      const elapsed = Date.now() - startup.spawnedAtMs
      startup.firstOutputMs ??= elapsed
      appendFileSync(output, `[+${elapsed} ms ${label}] ${chunk}`)
      destination.write(chunk)
    })
  }
  console.log(`Auth emulator output: ${output}`)
}

async function stop(child) {
  if (child.exitCode !== null || child.signalCode !== null || !child.pid) return
  if (process.platform === 'win32') {
    const killer = spawn('taskkill', ['/pid', String(child.pid), '/t', '/f'], { windowsHide: true, stdio: 'ignore' })
    await new Promise((done) => { killer.once('error', done); killer.once('close', done) })
  } else {
    child.kill('SIGTERM')
    await Promise.race([
      new Promise((done) => child.once('close', done)),
      new Promise((done) => setTimeout(() => { child.kill('SIGKILL'); done() }, 2000)),
    ])
  }
}

let cleanup
let emulatorDiagnostics
let temporary
function stopAll() {
  cleanup ??= (async () => { for (const child of [...children].reverse()) await stop(child) })()
  return cleanup
}
for (const [signal, code] of [['SIGINT', 130], ['SIGTERM', 143]]) {
  process.once(signal, () => { void stopAll().then(() => process.exit(code)) })
}

try {
  await assertFree(EMULATOR_PORTS.auth)
  await assertFree(appPort)
  const firebaseCli = (process.env.PATH ?? '').split(delimiter).flatMap((directory) => [
    join(directory, 'node_modules/firebase-tools/lib/bin/firebase.js'),
    resolve(directory, '../lib/node_modules/firebase-tools/lib/bin/firebase.js'),
  ]).find((candidate) => existsSync(candidate))
  if (!firebaseCli) throw new Error('Installed Firebase CLI required; no package will be installed automatically')
  temporary = await mkdtemp(join(tmpdir(), 'taskly-auth-e2e-'))
  await mkdir(resolve('test-results'), { recursive: true })
  emulatorDiagnostics = await mkdtemp(resolve('test-results/auth-emulator-'))
  const config = join(temporary, 'firebase.json')
  await writeFile(config, JSON.stringify({ emulators: {
    auth: { host: EMULATOR_HOST, port: EMULATOR_PORTS.auth },
    ui: { enabled: false }, singleProjectMode: true,
  } }))
  await writeFile(join(emulatorDiagnostics, 'output.log'), '')
  startup = { cli: firebaseCli, config, spawnedAtMs: Date.now(), firstOutputMs: null,
    readyMs: null, timeoutMs: 90_000, status: 'starting' }
  const emulator = start(firebaseCli, [
    'emulators:start', '--only', 'auth', '--project', EMULATOR_PROJECT_ID,
    '--config', config, '--non-interactive', '--debug',
  ], { cwd: temporary, stdio: ['ignore', 'pipe', 'pipe'] })
  captureEmulator(emulator, emulatorDiagnostics)
  startup.readyMs = await ready(emulatorUrl, emulator)
  startup.status = 'ready'
  console.log(`Auth emulator ready in ${startup.readyMs} ms; first output at ${startup.firstOutputMs} ms`)
  await completed(start(resolve('node_modules/typescript/bin/tsc'), ['-b']))
  await completed(start(resolve('node_modules/vite/bin/vite.js'), ['build', '--outDir', 'test-results/e2e-dist']))
  const server = start(resolve('node_modules/vite/bin/vite.js'), [
    'preview', '--outDir', 'test-results/e2e-dist', '--host', EMULATOR_HOST, '--port', String(appPort), '--strictPort',
  ])
  await ready(appUrl, server)
  await completed(start(resolve('node_modules/@playwright/test/cli.js'), [
    'test', ...(args.length ? args : ['--grep-invert', '@comparison']),
  ]))
} catch (error) {
  if (startup) startup.failure = error.message
  console.error(error.message)
  process.exitCode = 1
} finally {
  await stopAll()
  if (emulatorDiagnostics && startup) {
    startup.finishedAt = new Date().toISOString()
    if (startup.status === 'starting') startup.status = 'failed'
    await writeFile(join(emulatorDiagnostics, 'startup.json'), JSON.stringify(startup, null, 2) + '\n')
    const debugLog = join(temporary, 'firebase-debug.log')
    if (existsSync(debugLog)) await copyFile(debugLog, join(emulatorDiagnostics, 'firebase-debug.log'))
    console.log(`Auth emulator diagnostics retained: ${emulatorDiagnostics}`)
  }
}
