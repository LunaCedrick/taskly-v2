import { execFileSync, spawn } from 'node:child_process'
import { copyFile, mkdir, mkdtemp, readFile, stat, writeFile } from 'node:fs/promises'
import { resolve, join } from 'node:path'
import { cpus, freemem, totalmem, platform, release } from 'node:os'
import { preview } from 'vite'
import { startEmulatorHarness } from '../../scripts/emulator-runner.mjs'

const root = process.cwd()
const main = resolve('test-results/gate-3/review-main')
const directory = await mkdtemp(resolve('docs/qa/gate-3/phase2-acceptance-'))
const git = (args, cwd = root) => execFileSync('git', args, { cwd, encoding: 'utf8' }).trim()
const runs = [], chromeChecks = [], servers = []
let harness
const manifest = { protocol: 'PHASE-2-PROTOCOL.md: Q15', acceptance: true, status: 'preparing',
  sourceA: git(['rev-parse', 'HEAD'], main), sourceB: git(['rev-parse', 'HEAD']),
  startedAt: new Date().toISOString(), runs, chromeChecks }
const save = () => writeFile(join(directory, 'manifest.json'), JSON.stringify(manifest) + '\n', 'utf8')
function machine(label) {
  const output = execFileSync('powershell.exe', ['-NoProfile', '-NonInteractive', '-Command',
    '$p = @(Get-Process); [pscustomobject]@{ Chrome = @($p | Where-Object ProcessName -eq "chrome").Count; Code = @($p | Where-Object ProcessName -eq "Code").Count; Heavy = @($p | Where-Object ProcessName -match "^(msedge|firefox|Discord|Teams|ms-teams|steam|obs64|Photoshop|blender)$" | Select-Object ProcessName,Id,CPU,WorkingSet64); Windows = @($p | Where-Object MainWindowHandle -ne 0 | Select-Object ProcessName,Id); TopMemory = @($p | Sort-Object WorkingSet64 -Descending | Select-Object -First 12 ProcessName,Id,CPU,WorkingSet64); TopCPU = @($p | Sort-Object CPU -Descending | Select-Object -First 12 ProcessName,Id,CPU,WorkingSet64) } | ConvertTo-Json -Depth 4 -Compress'],
  { encoding: 'utf8', windowsHide: true })
  const state = JSON.parse(output)
  chromeChecks.push({ label, at: new Date().toISOString(), state, freeMemory: freemem() })
  if (state.Chrome || state.Code || state.Heavy.length) throw new Error(`Heavy apps still open at ${label}`)
}
async function run(args, cwd, env, file) {
  const output = []
  const child = spawn(process.execPath, args, { cwd, env, windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'] })
  child.stdout.on('data', (chunk) => output.push(chunk.toString()))
  child.stderr.on('data', (chunk) => output.push(chunk.toString()))
  const code = await new Promise((done, reject) => { child.once('error', reject); child.once('close', done) })
  await writeFile(file, JSON.stringify({ code, output: output.join('') }) + '\n', 'utf8')
  return code
}
try {
  if (manifest.sourceA !== git(['rev-parse', 'origin/main'])) throw new Error('Baseline must be unchanged origin/main')
  if (git(['status', '--porcelain'], main)) throw new Error('Main is dirty')
  if (git(['diff', '--name-only', 'HEAD', '--', 'src', 'tests', 'firestore.rules'])) throw new Error('Commit source/tests first')
  manifest.machine = { cpu: cpus()[0].model, logicalCpus: cpus().length, totalMemory: totalmem(),
    freeMemory: freemem(), os: `${platform()} ${release()}`, node: process.version }
  machine('session-before-builds')
  await save()
  harness = await startEmulatorHarness()
  manifest.emulatorDirectory = harness.diagnosticsDirectory
  for (const [side, source, port] of [['A', main, 4175], ['B', root, 4173]]) {
    const out = resolve(directory, 'builds', side, 'dist')
    await mkdir(resolve(directory, 'builds', side), { recursive: true })
    if (await run([resolve('tests/diagnostics/build-side.mjs'), source, out, 'normal'], root, harness.environment,
      resolve(directory, 'builds', side, 'command.json'))) throw new Error(`Build ${side} failed`)
    servers.push(await preview({ configFile: false, root: source, build: { outDir: out },
      preview: { host: '127.0.0.1', port, strictPort: true } }))
  }
  manifest.status = 'running'
  for (const label of ['A-baseline', 'B1', 'B2', 'B3']) {
    machine(`${label}-before`)
    const side = label[0], source = side === 'A' ? main : root
    const out = resolve(directory, label)
    await mkdir(out)
    const runId = `${directory.split(/[\\/]/).at(-1)}-${label}`
    const startedAt = Date.now()
    const code = await run([resolve('node_modules/@playwright/test/cli.js'), 'test', '--config',
      resolve('tests/diagnostics/playwright.config.ts'), '--grep', 'route speed run 1:'], source,
    { ...harness.environment, TASKLY_EVIDENCE_RUN: runId, TASKLY_SIDE_ROOT: source,
      TASKLY_SIDE_URL: `http://127.0.0.1:${side === 'A' ? 4175 : 4173}`,
      TASKLY_DIAGNOSTIC_OUTPUT: resolve(out, 'playwright') }, join(out, 'command.json'))
    const original = side === 'A' ? join(main, 'test-results/gate-2/speed-1.json')
      : resolve('test-results/gate-3', runId, 'speed-1.json')
    if ((await stat(original)).mtimeMs < startedAt) throw new Error('No fresh samples; refusing stale output')
    await copyFile(original, join(out, 'samples.json'))
    const samples = JSON.parse(await readFile(original, 'utf8'))
    const passing = code === 0 && samples.p95 < 100
    runs.push({ label, code, startedAt, endedAt: Date.now(), passing, samples })
    machine(`${label}-after`)
    console.log(`${label}: exit ${code}, p95 ${samples.p95}, ${samples.transitions.length} samples`)
    if (side === 'A' && !passing) {
      manifest.status = 'invalid-baseline'; manifest.branchOutcome = 'neither pass nor fail'
      await save()
      process.exitCode = 2
      break
    }
    await save()
  }
  if (manifest.status === 'running') {
    manifest.status = runs.every((run) => run.passing) ? 'passed' : 'failed'
    if (manifest.status === 'failed') process.exitCode = 1
  }
} catch (error) {
  manifest.status = 'error'; manifest.error = String(error); process.exitCode = 1
} finally {
  manifest.finishedAt = new Date().toISOString()
  await save()
  for (const server of servers) { server.httpServer.closeAllConnections(); await new Promise((done) => server.httpServer.close(done)) }
  await harness?.stop()
  console.log(`Q15 evidence: ${directory}; ${manifest.status}`)
}
