import { spawn } from 'node:child_process'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { chromium } from '@playwright/test'

const run = (command, options = {}) => spawn(process.env.ComSpec || 'cmd.exe', ['/d', '/s', '/c', command], {
  windowsHide: true, stdio: 'inherit', ...options,
})
await mkdir('test-results', { recursive: true })
await mkdir('docs/qa/gate-0', { recursive: true })
const server = run('npm run preview -- --host 127.0.0.1 --port 4174 --strictPort')
try {
  let ready = false
  for (let attempt = 0; attempt < 50; attempt++) {
    try { ready = (await fetch('http://127.0.0.1:4174')).ok } catch { /* Server is starting. */ }
    if (ready) break
    await new Promise((resolve) => setTimeout(resolve, 200))
  }
  if (!ready) throw new Error('Preview server did not start')
  const audit = run('npm run lighthouse:audit', { env: { ...process.env, CHROME_PATH: chromium.executablePath() } })
  const exitCode = await new Promise((resolve) => audit.on('exit', resolve))
  // Lighthouse can report an audited score but encounter a Windows temp cleanup error.
  const report = JSON.parse(await readFile('test-results/lighthouse.report.json', 'utf8'))
  const metrics = {
    lighthouseVersion: report.lighthouseVersion,
    performance: report.categories.performance.score * 100,
    accessibility: report.categories.accessibility.score * 100,
    lcpMs: report.audits['largest-contentful-paint'].numericValue,
    totalBlockingTimeMs: report.audits['total-blocking-time'].numericValue,
    speedIndexMs: report.audits['speed-index'].numericValue,
    environment: report.environment,
    configSettings: report.configSettings,
    failedAccessibilityAudits: report.categories.accessibility.auditRefs.map(({ id }) => report.audits[id])
      .filter((audit) => audit.score === 0).map((audit) => ({ id: audit.id, title: audit.title })),
    cliExitCode: exitCode,
  }
  await writeFile('docs/qa/gate-0/lighthouse.json', JSON.stringify(metrics, null, 2) + '\n')
  console.log(JSON.stringify(metrics, null, 2))
  if (exitCode !== 0 || metrics.performance < 90 || metrics.lcpMs >= 2500) process.exitCode = 1
} finally {
  // cmd.exe is a wrapper; terminate its entire server process tree on Windows.
  const stop = spawn('taskkill', ['/pid', String(server.pid), '/t', '/f'], { windowsHide: true, stdio: 'ignore' })
  await new Promise((resolve) => stop.on('exit', resolve))
}
