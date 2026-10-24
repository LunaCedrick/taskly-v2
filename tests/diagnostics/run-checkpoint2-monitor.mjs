import { spawn, execFileSync } from 'node:child_process'
import { mkdir, mkdtemp, copyFile, readFile, writeFile, stat } from 'node:fs/promises'
import { resolve, join } from 'node:path'
import { preview } from 'vite'
import { startEmulatorHarness } from '../../scripts/emulator-runner.mjs'
import { decorate, summarize } from './analyze-speed.mjs'

const root = process.cwd()
const main = resolve('test-results/gate-3/review-main')
const directory = await mkdtemp(resolve('docs/qa/gate-3/checkpoint2-monitor-'))
const order = ['A1', 'B1', 'A2', 'B2', 'A3', 'B3']
const runs = []
const servers = []
let harness
async function run(args, cwd, env, file) {
  const output = []
  const child = spawn(process.execPath, args, { cwd, env, windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'] })
  child.stdout.on('data', (chunk) => output.push(chunk.toString()))
  child.stderr.on('data', (chunk) => output.push(chunk.toString()))
  const code = await new Promise((done, reject) => { child.once('error', reject); child.once('close', done) })
  await writeFile(file, JSON.stringify({ code, output: output.join('') }) + '\n')
  return code
}
try {
  const git = (args, cwd = root) => execFileSync('git', args, { cwd, encoding: 'utf8' }).trim()
  const revisionA = git(['rev-parse', 'HEAD'], main)
  const revisionB = git(['rev-parse', 'HEAD'])
  if (revisionA !== git(['rev-parse', 'origin/main'])) throw new Error('Baseline checkout must match unchanged origin/main')
  if (git(['status', '--porcelain'], main)) throw new Error('Dirty main checkout')
  if (git(['diff', '--name-only', 'HEAD', '--', 'src', 'tests', 'firestore.rules'])) throw new Error('Commit implementation first')
  const manifest = { diagnostic: true, acceptance: false, revisionA, revisionB, order, runs,
    protocol: 'SPEED-CHECKPOINT-1.md: Checkpoint 2 regression-monitor protocol',
    environment: 'e2e; identical explicit fake Firebase config; empty envDir; same existing dependencies' }
  await writeFile(join(directory, 'manifest.json'), JSON.stringify(manifest) + '\n')
  harness = await startEmulatorHarness()
  for (const [side, source, port] of [['A', main, 4175], ['B', root, 4173]]) {
    const out = resolve(directory, 'builds', side, 'dist')
    await mkdir(resolve(directory, 'builds', side), { recursive: true })
    if (await run([resolve('tests/diagnostics/build-side.mjs'), source, out, 'normal'], root, harness.environment,
      resolve(directory, 'builds', side, 'command.json'))) throw new Error(`Build ${side} failed`)
    servers.push(await preview({ configFile: false, root: source, build: { outDir: out },
      preview: { host: '127.0.0.1', port, strictPort: true } }))
  }
  for (const label of order) {
    const source = label[0] === 'A' ? main : root
    const output = resolve(directory, label)
    await mkdir(output)
    const runId = `${directory.split(/[\\/]/).at(-1)}-${label}`
    const startedAt = Date.now()
    const code = await run([resolve('node_modules/@playwright/test/cli.js'), 'test', '--config',
      resolve('tests/diagnostics/playwright.config.ts'), '--grep', 'route speed run 1:'], source,
    { ...harness.environment, TASKLY_EVIDENCE_RUN: runId, TASKLY_SIDE_ROOT: source,
      TASKLY_SIDE_URL: `http://127.0.0.1:${label[0] === 'A' ? 4175 : 4173}`,
      TASKLY_DIAGNOSTIC_OUTPUT: resolve(output, 'playwright') }, join(output, 'command.json'))
    const original = label[0] === 'A' ? join(main, 'test-results/gate-2/speed-1.json')
      : resolve('test-results/gate-3', runId, 'speed-1.json')
    let samples
    let missingSamples
    try {
      if ((await stat(original)).mtimeMs < startedAt) throw new Error('No fresh samples')
      await copyFile(original, join(output, 'samples.json'))
      samples = JSON.parse(await readFile(original, 'utf8'))
    } catch (error) { missingSamples = String(error) }
    runs.push({ label, code, startedAt, endedAt: Date.now(), missingSamples, samples })
    await writeFile(join(directory, 'manifest.json'), JSON.stringify(manifest) + '\n')
    console.log(`${label}: exit ${code}; p95 ${samples?.p95}; ${samples?.transitions.length ?? 0} samples`)
  }
  const summary = Object.fromEntries(['A', 'B'].map((side) => [side,
    summarize(runs.filter((run) => run.label.startsWith(side) && run.samples).map((run) => run.samples))]))
  await writeFile(join(directory, 'summary.json'), JSON.stringify({ diagnostic: true, summary,
    runs: runs.filter((run) => run.samples).map(({ label, samples }) => ({ label, median: samples.median,
      p95: samples.p95, max: samples.max, ...summarize([samples]),
      over100Samples: decorate(samples).filter((sample) => sample.milliseconds > 100) })) }) + '\n')
  console.log(JSON.stringify(summary))
} catch (error) {
  await writeFile(join(directory, 'failure.json'), JSON.stringify({ error: String(error), runs }) + '\n')
  throw error
} finally {
  for (const server of servers) { server.httpServer.closeAllConnections(); await new Promise((done) => server.httpServer.close(done)) }
  await harness?.stop()
  console.log(`Checkpoint 2 monitor: ${directory}`)
}
