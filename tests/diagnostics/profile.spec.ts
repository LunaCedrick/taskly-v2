import { mkdir, writeFile } from 'node:fs/promises'
import { gzipSync } from 'node:zlib'
import { test, expect } from '../e2e/fixtures/auth'

declare global { interface Window {
  __profileResult?: { started: number; ended?: number; duration?: number }
  __profileLongTasks?: { start: number; duration: number }[]
} }

test('diagnostic timeline: bounded repeat tasks/project cycles, never acceptance', async ({ page }) => {
  const clicks = Number(process.env.TASKLY_PROFILE_CLICKS ?? 120)
  if (!Number.isInteger(clicks) || clicks < 2 || clicks > 600 || clicks % 2) throw new Error('Invalid profile length')
  test.setTimeout(clicks > 120 ? 240_000 : 120_000) // Bounded trace length only; no acceptance/emulator deadline change.
  const directory = process.env.TASKLY_DIAGNOSTIC_OUTPUT!
  await mkdir(directory, { recursive: true })
  const session = await page.context().newCDPSession(page)
  await page.goto('/')
  await page.waitForFunction(() => {
    const state = window.__TASKLY_G2_SYNC_TEST__?.snapshot()
    return state?.dataReady && state.tasks === 1000 && state.streams.activity.ready && state.activeHandles === 3
  })
  await page.evaluate(() => document.fonts.ready)
  await session.send('Emulation.setCPUThrottlingRate', { rate: 4 })
  await page.evaluate(() => {
    window.__profileLongTasks = []
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) window.__profileLongTasks!.push({ start: entry.startTime, duration: entry.duration })
    }).observe({ type: 'longtask' })
  })
  // Preserve Chrome's complete trace objects; Playwright's dictionary typing is narrower.
  const events: unknown[] = []
  session.on('Tracing.dataCollected', (data) => events.push(...data.value))
  await session.send('Tracing.start', { categories:
    'devtools.timeline,disabled-by-default-devtools.timeline,v8,disabled-by-default-v8.gc,blink.user_timing,toplevel',
  transferMode: 'ReportEvents' })
  const windows = []
  try {
    for (let sequence = 1; sequence <= clicks; sequence++) {
      const project = sequence % 2 === 0
      const to = project ? '/projects/project-1' : '/tasks'
      const from = new URL(page.url()).pathname
      const view = project ? 'project' : 'tasks'
      await page.evaluate(({ view, sequence }) => {
        window.__profileResult = { started: 0 }
        document.addEventListener('click', () => {
          const result = window.__profileResult!
          result.started = performance.now()
          performance.mark(`taskly-start-${sequence}`)
          const committed = () => {
            const root = document.querySelector(`[data-view="${view}"]`)
            if (!root?.querySelector('[role="listitem"]')) { requestAnimationFrame(committed); return }
            requestAnimationFrame(() => {
              result.ended = performance.now()
              result.duration = result.ended - result.started
              performance.mark(`taskly-end-${sequence}`)
            })
          }
          requestAnimationFrame(committed)
        }, { once: true, capture: true })
      }, { view, sequence })
      await page.locator(`aside nav a[href="${to}"]`).click()
      await page.waitForFunction(() => window.__profileResult?.duration !== undefined)
      windows.push({ sequence, from, to, repeat: sequence > 2, ...await page.evaluate(() => window.__profileResult!) })
    }
  } finally {
    const complete = new Promise<void>((done) => session.once('Tracing.tracingComplete', () => done()))
    await session.send('Tracing.end')
    await complete
    const longTasks = await page.evaluate(() => window.__profileLongTasks)
    await writeFile(`${directory}/windows.json`, JSON.stringify({ diagnostic: true, cpu: 4, windows, longTasks }) + '\n')
    await writeFile(`${directory}/timeline.json.gz`, gzipSync(JSON.stringify({ traceEvents: events })))
    await session.detach()
  }
  expect(windows).toHaveLength(clicks)
})
