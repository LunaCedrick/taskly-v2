import { mkdir, mkdtemp, writeFile } from 'node:fs/promises'
import { spawn } from 'node:child_process'
import { resolve } from 'node:path'
import { preview } from 'vite'
import { startEmulatorHarness } from '../../scripts/emulator-runner.mjs'

const directory = await mkdtemp(resolve('docs/qa/gate-3/profile-review-'))
const builtApp = resolve(process.argv[2] ?? 'docs/qa/gate-3/speed-review-UrhkFS/builds/B/dist')
await mkdir(resolve(directory, 'profile'))
let harness, server
try {
  harness = await startEmulatorHarness()
  server = await preview({ configFile: false, build: {
    outDir: builtApp },
  preview: { host: '127.0.0.1', port: 4173, strictPort: true } })
  const child = spawn(process.execPath, [resolve('node_modules/@playwright/test/cli.js'),
    'test', '--config', resolve('tests/diagnostics/playwright.config.ts')], {
    windowsHide: true, env: { ...harness.environment, TASKLY_PROFILE: 'true', TASKLY_PROFILE_CLICKS: '600',
      TASKLY_SIDE_URL: 'http://127.0.0.1:4173', TASKLY_DIAGNOSTIC_OUTPUT: resolve(directory, 'profile') },
    stdio: ['ignore', 'pipe', 'pipe'],
  })
  const output = []
  child.stdout.on('data', (v) => output.push(v.toString()))
  child.stderr.on('data', (v) => output.push(v.toString()))
  const code = await new Promise((done, reject) => { child.once('error', reject); child.once('close', done) })
  await writeFile(resolve(directory, 'command.json'), JSON.stringify({ code, output: output.join(''),
    clicks: 600, cpu: 4, builtApp, emulator: harness.diagnosticsDirectory }) + '\n')
  process.exitCode = code
} finally {
  server?.httpServer.closeAllConnections()
  if (server) await new Promise((done) => server.httpServer.close(done))
  await harness?.stop()
  console.log(`Extended profile evidence: ${directory}`)
}
