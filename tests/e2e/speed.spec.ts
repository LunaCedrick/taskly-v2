import { type Page } from '@playwright/test'
import { expect, test } from './fixtures/auth'
import { mkdir, writeFile } from 'node:fs/promises'
import { cpus, hostname, platform, release, totalmem } from 'node:os'
import { QA_DIRECTORY } from './fixtures/qa'

// Browser tracing changes CPU-throttled timings; retain raw measurements instead.
test.use({ trace: 'off' })

type Measurement = { from: string; to: string; milliseconds: number }
const TRANSITIONS_PER_RUN = 60

function median(sorted: number[]) {
  const middle = Math.floor(sorted.length / 2)
  return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2
}

function measurementJson<T extends { transitions: Measurement[] }>(result: T) {
  const { transitions, ...summary } = result
  // Keep each sample on one line so the 60-transition artifacts stay readable and under 300 lines.
  return `${JSON.stringify(summary, null, 2).slice(0, -2)},\n  "transitions": [\n${
    transitions.map((transition) => `    ${JSON.stringify(transition)}`).join(',\n')
  }\n  ]\n}\n`
}
declare global {
  interface Window { __routeMeasurement?: { started: number; duration?: number } }
}

async function measureRoutes(page: Page, virtualize: boolean) {
  await page.goto(virtualize ? '/' : '/?virtualize=off')
  await page.evaluate(() => document.fonts.ready)
  await page.waitForLoadState('networkidle')
  const session = await page.context().newCDPSession(page)
  await session.send('Emulation.setCPUThrottlingRate', { rate: 4 })
  const network: string[] = []
  const errors: string[] = []
  page.on('request', (request) => network.push(request.url()))
  page.on('pageerror', (error) => errors.push(error.message))
  page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()) })
  const measurements: Measurement[] = []
  const routes = [
    { path: '/tasks', view: 'tasks' },
    { path: '/projects/project-1', view: 'project' },
    { path: '/', view: 'dashboard' },
  ]
  for (let index = 0; index < TRANSITIONS_PER_RUN; index++) {
    const target = routes[index % routes.length]
    const from = new URL(page.url()).pathname
    // Start at the trusted click event. Resolve only after the new view and its rows
    // commit in the first rAF, then cross its paint into the second rAF.
    // Includes route scheduling, rendering, and layout; no extra frame after that paint.
    await page.evaluate(({ view }) => {
      const result: { started: number; duration?: number } = { started: 0 }
      window.__routeMeasurement = result
      document.addEventListener('click', () => {
        result.started = performance.now()
        const committed = () => {
          const root = document.querySelector(`[data-view="${view}"]`)
          if (!root || !root.querySelector('[role="listitem"]')) {
            requestAnimationFrame(committed)
            return
          }
          requestAnimationFrame(() => {
            result.duration = performance.now() - result.started
          })
        }
        requestAnimationFrame(committed)
      }, { once: true, capture: true })
    }, { view: target.view })
    await page.locator(`aside nav a[href="${target.path}"]`).click()
    await page.waitForFunction(() => {
      const result = window.__routeMeasurement
      return result?.duration !== undefined
    })
    const duration = await page.evaluate(() => window.__routeMeasurement!.duration!)
    measurements.push({ from, to: target.path, milliseconds: Number(duration.toFixed(2)) })
  }
  const sorted = measurements.map((item) => item.milliseconds).sort((a, b) => a - b)
  const result = {
    virtualize, transitions: measurements, median: median(sorted),
    p75: sorted[Math.ceil(sorted.length * .75) - 1],
    p95: sorted[Math.ceil(sorted.length * .95) - 1],
    max: sorted[sorted.length - 1],
    transitionsOver100Ms: sorted.filter((duration) => duration > 100).length,
    navigationRequests: network, consoleErrors: errors, cpuThrottle: 4,
    machine: { hostname: hostname(), cpu: cpus()[0].model, logicalCpus: cpus().length,
      memoryGiB: Number((totalmem() / 1024 ** 3).toFixed(2)), os: `${platform()} ${release()}`,
      node: process.version, browser: page.context().browser()?.version() },
  }
  await session.detach()
  return result
}

for (const run of [1, 2, 3]) {
  test(`route speed run ${run}: p95 < 100ms, no navigation requests`, async ({ page }, testInfo) => {
    const result = await measureRoutes(page, true)
    await mkdir(QA_DIRECTORY, { recursive: true })
    await writeFile(`${QA_DIRECTORY}/speed-${run}.json`, measurementJson(result))
    await testInfo.attach('measurement', { body: JSON.stringify(result), contentType: 'application/json' })
    console.log(`Run ${run} (${result.transitions.length} transitions): median ${result.median.toFixed(2)}ms; p95 ${result.p95.toFixed(2)}ms; max ${result.max.toFixed(2)}ms; over 100ms ${result.transitionsOver100Ms}; requests ${result.navigationRequests.length}`)
    expect(result.consoleErrors).toEqual([])
    expect(result.navigationRequests).toEqual([])
    expect(result.p95).toBeLessThan(100)
  })
}

test('informational comparison: My Tasks without virtualization @comparison', async ({ page }, testInfo) => {
  const result = await measureRoutes(page, false)
  const myTasks = result.transitions.filter((item) => item.to === '/tasks').map((item) => item.milliseconds).sort((a, b) => a - b)
  const comparison = { ...result, myTasksMedian: median(myTasks),
    myTasksP95: myTasks[Math.ceil(myTasks.length * .95) - 1], myTasksMax: myTasks[myTasks.length - 1] }
  await mkdir(QA_DIRECTORY, { recursive: true })
  await writeFile(`${QA_DIRECTORY}/speed-unvirtualized.json`, measurementJson(comparison))
  await testInfo.attach('comparison', { body: JSON.stringify(comparison), contentType: 'application/json' })
  console.log(`Virtualization off, My Tasks: median ${comparison.myTasksMedian}ms; p95 ${comparison.myTasksP95}ms; max ${comparison.myTasksMax}ms (informational)`)
  expect(result.navigationRequests).toEqual([])
  expect(result.consoleErrors).toEqual([])
})
