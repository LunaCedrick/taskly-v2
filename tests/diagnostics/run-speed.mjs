import { spawn, execFileSync } from 'node:child_process'
import { mkdir, mkdtemp, copyFile, readFile, writeFile, symlink, lstat, stat } from 'node:fs/promises'
import { resolve, join } from 'node:path'
import { preview } from 'vite'
import { startEmulatorHarness } from '../../scripts/emulator-runner.mjs'
import { normalizeBundleEvidence } from '../../scripts/bundle-graph.mjs'

const root = process.cwd()
const main = resolve('test-results/gate-3/review-main')
const record = await mkdtemp(resolve('docs/qa/gate-3/speed-review-'))
const config = resolve('tests/diagnostics/playwright.config.ts')
const buildScript = resolve('tests/diagnostics/build-side.mjs')
const cli = resolve('node_modules/@playwright/test/cli.js')
const log = []
let harness
const servers = []
async function run(args, cwd, env, file) {
  const output = []
  const child = spawn(process.execPath, args, { cwd, env, windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'] })
  child.stdout.on('data', (v) => output.push(v.toString()))
  child.stderr.on('data', (v) => output.push(v.toString()))
  const code = await new Promise((done, reject) => { child.once('error', reject); child.once('close', done) })
  await writeFile(file, JSON.stringify({ code, output: output.join('') }) + '\n')
  return code
}
try {
  if (execFileSync('git', ['diff', '--name-only', 'a05cffc', '--', 'src', 'firestore.rules'],
    { cwd: root, encoding: 'utf8' }).trim()) throw new Error('Refusing to label changed app/rules as reviewed a05cffc')
  const revision = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: main, encoding: 'utf8' }).trim()
  if (!revision.startsWith('d16fe58')) throw new Error('Expected unchanged G2 main')
  if (execFileSync('git', ['status', '--porcelain'], { cwd: main, encoding: 'utf8' }).trim()) throw new Error('Main checkout is dirty')
  try { await lstat(join(main, 'node_modules')) } catch {
    await symlink(resolve('node_modules'), join(main, 'node_modules'), process.platform === 'win32' ? 'junction' : 'dir')
  }
  harness = await startEmulatorHarness()
  const environment = harness.environment
  for (const [side, source, port, variant] of [['A', main, 4175, 'normal'], ['B', root, 4173, 'normal'], ['C', root, 4177, 'no-probe']]) {
    const out = resolve(record, 'builds', side, 'dist')
    await mkdir(resolve(record, 'builds', side), { recursive: true })
    if (await run([buildScript, source, out, variant], root, environment, resolve(record, 'builds', side, 'build-log.json'))) {
      throw new Error(`Build ${side} failed`)
    }
    const server = await preview({ configFile: false, root: source, build: { outDir: out },
      preview: { host: '127.0.0.1', port, strictPort: true } })
    servers.push(server)
  }
  const sequence = Array.from({ length: 6 }, (_, i) => [`A${i + 1}`, `B${i + 1}`]).flat()
    .concat(Array.from({ length: 6 }, (_, i) => `C${i + 1}`))
  for (const label of sequence) {
    const side = label[0]
    const source = side === 'A' ? main : root
    const directory = resolve(record, label)
    await mkdir(directory)
    const runId = `${record.split(/[\\/]/).at(-1)}-${label}`
    const env = { ...environment, TASKLY_EVIDENCE_RUN: runId, TASKLY_SIDE_ROOT: source,
      TASKLY_SIDE_URL: `http://127.0.0.1:${side === 'A' ? 4175 : side === 'B' ? 4173 : 4177}`,
      TASKLY_DIAGNOSTIC_OUTPUT: resolve(directory, 'playwright') }
    const startedAt = Date.now()
    const code = await run([cli, 'test', '--config', config, '--grep', 'route speed run 1:'], source, env,
      resolve(directory, 'command.json'))
    // Main's spec has a fixed output path. Copy immediately after EVERY run, even failure.
    const original = side === 'A' ? join(main, 'test-results/gate-2/speed-1.json')
      : resolve('test-results/gate-3', runId, 'speed-1.json')
    let samples = null
    try {
      if ((await stat(original)).mtimeMs < startedAt) throw new Error('No fresh samples: refusing a stale main output')
      await copyFile(original, resolve(directory, 'samples.json'))
      samples = JSON.parse(await readFile(original, 'utf8'))
    } catch (error) { log.push({ label, missingSamples: String(error) }) }
    log.push({ label, code, p95: samples?.p95, samples: samples?.transitions.length, acceptance: 'diagnostic only' })
    await writeFile(resolve(record, 'manifest.json'), JSON.stringify({ revisionA: revision, revisionB: 'a05cffc',
      order: sequence, runs: log, emulatorDirectory: harness.diagnosticsDirectory }) + '\n')
    console.log(`${label}: exit ${code}; p95 ${samples?.p95}; samples ${samples?.transitions.length}`)
  }
  // A separately traced profile follows all untraced samples. Same B build, no app edits.
  const directory = resolve(record, 'profile')
  await mkdir(directory)
  const code = await run([cli, 'test', '--config', config], root, { ...environment, TASKLY_PROFILE: 'true',
    TASKLY_SIDE_URL: 'http://127.0.0.1:4173', TASKLY_DIAGNOSTIC_OUTPUT: directory }, resolve(directory, 'command.json'))
  await writeFile(resolve(record, 'profile-status.json'), JSON.stringify({ code }) + '\n')
} catch (error) {
  await writeFile(resolve(record, 'session-failure.json'), JSON.stringify(normalizeBundleEvidence({
    error: String(error), runs: log })) + '\n')
  throw error
} finally {
  for (const server of servers) {
    server.httpServer.closeAllConnections()
    await new Promise((done) => server.httpServer.close(done))
  }
  await harness?.stop()
  console.log(`Diagnostic evidence: ${record}`)
}
