import { appendFileSync } from 'node:fs'
import { mkdir, mkdtemp, readFile, readdir, writeFile } from 'node:fs/promises'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { EMULATOR_HOST, EMULATOR_PORTS, EMULATOR_PROJECT_ID } from '../src/lib/firebase/emulator-config.ts'
import { assertFreePort, auxiliaryPort, createProcessOwner, findFirebaseCli, installedFirebaseCliVersion, javaVersion } from './emulator-process.mjs'
import { EMULATOR_STARTUP_TIMEOUT_MS, waitForApp, waitForEmulators } from './emulator-readiness.mjs'

export { requireJava21 } from './emulator-process.mjs'
export { EMULATOR_STARTUP_TIMEOUT_MS, waitForEmulators } from './emulator-readiness.mjs'

function sanitized(text) {
  return text.replace(/((?:access_token|refresh_token|id_token|client_secret)["'\s:=]+)[^\s,"'}]+/gi, '$1<redacted>')
    .replace(/(Authorization["'\s:=]+Bearer\s+)[^\s,"'}]+/gi, '$1<redacted>')
}

export function emulatorEnvironment(recordEvidence = false) {
  return {
    ...process.env, CI: 'true', FIREBASE_CLI_DISABLE_UPDATE_CHECK: 'true',
    TASKLY_E2E_MANAGED: 'true', TASKLY_EMULATORS_MANAGED: 'true',
    TASKLY_RECORD_EVIDENCE: String(recordEvidence),
    FIREBASE_AUTH_EMULATOR_HOST: `${EMULATOR_HOST}:${EMULATOR_PORTS.auth}`,
    FIRESTORE_EMULATOR_HOST: `${EMULATOR_HOST}:${EMULATOR_PORTS.firestore}`,
    GCLOUD_PROJECT: EMULATOR_PROJECT_ID, GOOGLE_CLOUD_PROJECT: EMULATOR_PROJECT_ID,
    VITE_USE_AUTH_EMULATOR: 'true', VITE_USE_FIRESTORE_EMULATOR: 'true',
    VITE_FIREBASE_API_KEY: 'fake-api-key', VITE_FIREBASE_AUTH_DOMAIN: 'localhost',
    VITE_FIREBASE_PROJECT_ID: EMULATOR_PROJECT_ID,
    VITE_FIREBASE_STORAGE_BUCKET: '', VITE_FIREBASE_MESSAGING_SENDER_ID: '123456789',
    VITE_FIREBASE_APP_ID: '1:123456789:web:emulator',
  }
}

export async function startEmulatorHarness(options = {}) {
  const root = resolve(options.root ?? process.cwd())
  const qaDirectory = join(root, 'test-results/gate-3')
  await mkdir(qaDirectory, { recursive: true })
  const diagnosticsDirectory = await mkdtemp(join(qaDirectory, 'emulator-'))
  const environment = emulatorEnvironment(options.recordEvidence)
  environment.TASKLY_EVIDENCE_RUN = diagnosticsDirectory.split(/[\\/]/).at(-1)
  const owner = createProcessOwner(root, environment)
  const outputPath = join(diagnosticsDirectory, 'output.log')
  await writeFile(outputPath, '')
  const startup = { status: 'checking', timeoutMs: EMULATOR_STARTUP_TIMEOUT_MS,
    projectId: EMULATOR_PROJECT_ID, projectNameNote: 'demo-taskly-auth now names combined Auth/Firestore tests',
    spawnedAtMs: null, firstOutputMs: null, readyMs: null, services: {}, downloadActivity: [] }
  const signalHandlers = []
  let stopping
  async function stop(error) {
    if (error) startup.runFailure = sanitized(error.message)
    return (stopping ??= (async () => {
      await owner.stop()
      for (const [signal, handler] of signalHandlers) process.removeListener(signal, handler)
      if (startup.status !== 'ready') startup.status = 'failed'
      startup.finishedAt = new Date().toISOString()
      for (const file of await readdir(diagnosticsDirectory)) {
        if (file.endsWith('.log')) {
          const path = join(diagnosticsDirectory, file)
          await writeFile(path, sanitized(await readFile(path, 'utf8')))
        }
      }
      await writeFile(join(diagnosticsDirectory, 'startup.json'), JSON.stringify(startup, null, 2) + '\n')
      console.log(`Auth/Firestore emulator diagnostics retained: ${diagnosticsDirectory}`)
    })())
  }
  for (const [signal, code] of [['SIGINT', 130], ['SIGTERM', 143]]) {
    const handler = () => { void stop().then(() => process.exit(code)) }
    signalHandlers.push([signal, handler])
    process.once(signal, handler)
  }
  try {
    startup.java = javaVersion(environment)
    const cli = findFirebaseCli(root)
    startup.cli = { path: cli, version: installedFirebaseCliVersion(cli) }
    await assertFreePort(EMULATOR_PORTS.auth)
    await assertFreePort(EMULATOR_PORTS.firestore)
    const hubPort = await auxiliaryPort()
    const loggingPort = await auxiliaryPort()
    const websocketPort = await auxiliaryPort()
    environment.FIREBASE_EMULATOR_HUB = `${EMULATOR_HOST}:${hubPort}`
    const checkedIn = JSON.parse(await readFile(join(root, 'firebase.json'), 'utf8'))
    const config = {
      firestore: { ...checkedIn.firestore,
        rules: resolve(root, checkedIn.firestore.rules), indexes: resolve(root, checkedIn.firestore.indexes) },
      emulators: {
        auth: { host: EMULATOR_HOST, port: EMULATOR_PORTS.auth },
        firestore: { host: EMULATOR_HOST, port: EMULATOR_PORTS.firestore, websocketPort },
        hub: { host: EMULATOR_HOST, port: hubPort }, logging: { host: EMULATOR_HOST, port: loggingPort },
        ui: { enabled: false }, singleProjectMode: true,
      },
    }
    const configPath = join(diagnosticsDirectory, 'firebase.json')
    await writeFile(configPath, JSON.stringify(config, null, 2) + '\n')
    startup.config = configPath
    const debugLog = join(diagnosticsDirectory, 'firebase-debug.log')
    await writeFile(debugLog, '', { flag: 'wx' })
    startup.debugLog = debugLog
    const traceEnabled = environment.TASKLY_TRACE_EMULATOR_STARTUP === 'true'
    const tracePath = join(diagnosticsDirectory, 'module-loads.jsonl')
    if (traceEnabled) await writeFile(tracePath, '', { flag: 'wx' })
    startup.moduleTrace = { enabled: traceEnabled, file: traceEnabled ? tracePath : null,
      overhead: traceEnabled ? 'Synchronous module tracing adds overhead; all bootstrap and tracing time remain inside the shared deadline.' : null }
    startup.spawnedAtMs = Date.now()
    startup.status = 'starting'
    const cliEnvironment = { ...environment, FIREBASE_DEBUG_PATH: debugLog }
    const nodeArgs = []
    if (traceEnabled) {
      nodeArgs.push('--require', fileURLToPath(new URL('./trace-emulator-modules.cjs', import.meta.url)))
      Object.assign(cliEnvironment, { TASKLY_TRACE_MODULES_PATH: tracePath,
        TASKLY_TRACE_SPAWNED_AT_MS: String(startup.spawnedAtMs), TASKLY_TRACE_CLI_ROOT: resolve(dirname(cli), '../..') })
    }
    const emulator = owner.start(cli, [
      'emulators:start', '--only', 'auth,firestore', '--project', EMULATOR_PROJECT_ID,
      '--config', configPath, '--non-interactive', '--debug',
    ], { cwd: diagnosticsDirectory, env: cliEnvironment, nodeArgs, stdio: ['ignore', 'pipe', 'pipe'] })
    for (const [stream, destination, label] of [
      [emulator.stdout, process.stdout, 'stdout'], [emulator.stderr, process.stderr, 'stderr'],
    ]) {
      stream.on('data', (chunk) => {
        const elapsedMs = Date.now() - startup.spawnedAtMs
        startup.firstOutputMs ??= elapsedMs
        const text = sanitized(chunk.toString())
        appendFileSync(outputPath, `[+${elapsedMs} ms ${label}] ${text}`)
        for (const line of text.split(/\r?\n/).filter((line) => /download|extract|fetching|installing/i.test(line))) {
          startup.downloadActivity.push({ elapsedMs, line })
        }
        destination.write(text)
      })
    }
    emulator.once('exit', (code, signal) => {
      startup.exit = { code, signal, elapsedMs: Date.now() - startup.spawnedAtMs }
    })
    emulator.once('error', (error) => { startup.spawnError = sanitized(error.message) })
    await waitForEmulators(emulator, startup)
    startup.status = 'ready'
    console.log(`Auth ready ${startup.services.auth.readyMs} ms; Firestore ready ${startup.services.firestore.readyMs} ms; first output ${startup.firstOutputMs} ms`)
    const defaultOutDir = join(root, 'test-results/gate-3/e2e-dist')
    return {
      environment, diagnosticsDirectory, startup,
      run: owner.run,
      async build() {
        await owner.run(join(root, 'node_modules/typescript/bin/tsc'), ['-b'])
        await owner.run(join(root, 'node_modules/vite/bin/vite.js'), [
          'build', '--mode', 'e2e', '--outDir', defaultOutDir,
        ])
        return defaultOutDir
      },
      async serve({ port = 4173, outDir = defaultOutDir } = {}) {
        await assertFreePort(port)
        const url = `http://${EMULATOR_HOST}:${port}`
        const server = owner.start(join(root, 'node_modules/vite/bin/vite.js'), [
          'preview', '--mode', 'e2e', '--outDir', outDir, '--host', EMULATOR_HOST,
          '--port', String(port), '--strictPort',
        ])
        await waitForApp(server, url)
        return url
      },
      stop,
    }
  } catch (error) {
    startup.failure = sanitized(error.message)
    await stop(error)
    throw new Error(`${error.message}; diagnostics: ${diagnosticsDirectory}`, { cause: error })
  }
}
