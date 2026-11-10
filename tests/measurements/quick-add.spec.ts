import { test, expect } from '@playwright/test'
import { mkdir, writeFile } from 'node:fs/promises'
import { cpus, freemem, totalmem } from 'node:os'
import { signIn } from '../e2e/fixtures/auth'
import { collectDiagnostics, expectNormalDiagnostics, navigate } from '../e2e/fixtures/sync'
import { QA_DIRECTORY } from '../e2e/fixtures/qa'

type Sample = { sequence: number; width: number; route: string; title: string; milliseconds?: number;
  started?: number; taskId?: string; taskCount?: number; pendingSnapshotObserved?: boolean }
declare global { interface Window { __quickAddPaint?: Sample } }

// The instrumentation lives only in this Playwright test, never in app source/dist.
test('Q14: retain all 20 Enter-to-task-paint samples, each strictly under 100 ms', async ({ page }, info) => {
  test.setTimeout(120_000)
  const samples: Sample[] = []
  const diagnostics = collectDiagnostics(page)
  const machine = { cpu: cpus()[0].model, logicalCpus: cpus().length, totalMemory: totalmem(),
    freeMemory: freemem(), node: process.version, browser: page.context().browser()?.version() }
  const session = await page.context().newCDPSession(page)
  try {
    await signIn(page)
    await page.waitForFunction(() => Boolean(window.__TASKLY_G3_WRITES_TEST__))
    await page.evaluate(() => document.fonts.ready)
    await session.send('Emulation.setCPUThrottlingRate', { rate: 4 })
    for (const width of [1280, 390]) {
      await page.setViewportSize({ width, height: width === 390 ? 844 : 900 })
      for (const route of ['/projects/project-1', '/tasks']) {
        await navigate(page, route)
        await page.getByRole('button', { name: 'Quick Add', exact: true }).click()
        const input = page.getByRole('dialog').getByLabel('Title')
        for (let index = 0; index < 5; index++) {
          const sample: Sample = { sequence: samples.length + 1, width, route, title: `Q14 paint ${width} ${route} ${index}` }
          await input.fill(sample.title)
          await page.evaluate((sample) => {
            window.__quickAddPaint = sample
            const input = document.querySelector<HTMLTextAreaElement>('dialog textarea[name="title"]')!
            input.addEventListener('keydown', function start(event) {
              if (event.key !== 'Enter') return
              input.removeEventListener('keydown', start, true)
              sample.started = performance.now()
              const committed = () => {
                const task = window.__TASKLY_G3_WRITES_TEST__!.snapshot().tasks.find((task) => task.title === sample.title)
                const row = task && document.querySelector<HTMLElement>(`[data-task-id="${task.id}"]`)
                const list = row?.closest('[data-task-list]')
                const r = row?.getBoundingClientRect(), l = list?.getBoundingClientRect()
                if (!task || !r || !l || !r.height || r.bottom <= l.top || r.top >= l.bottom) {
                  requestAnimationFrame(committed)
                  return
                }
                sample.taskId = task.id
                sample.taskCount = window.__TASKLY_G3_WRITES_TEST__!.snapshot().tasks.length
                sample.pendingSnapshotObserved = window.__TASKLY_G2_SYNC_TEST__!.pendingDocuments.some((doc) => doc.id === task.id)
                requestAnimationFrame(() => { sample.milliseconds = performance.now() - sample.started! })
              }
              requestAnimationFrame(committed)
            }, true)
          }, sample)
          await input.press('Enter') // Trusted Enter; timer starts in its capture listener.
          try {
            await page.waitForFunction(() => window.__quickAddPaint?.milliseconds !== undefined)
          } finally { samples.push(await page.evaluate(() => window.__quickAddPaint!)) }
          await expect(input).toHaveValue('')
          await expect(input).toBeFocused()
          await page.evaluate(() => window.__TASKLY_G3_WRITES_TEST__!.wait('q14-between-samples'))
          await page.waitForFunction(() => window.__TASKLY_G3_WRITES_TEST__!.snapshot().waiters['q14-between-samples'].status === 'acknowledged')
        }
        await page.keyboard.press('Escape')
      }
    }
    expect(samples).toHaveLength(20)
    // Assert only after collecting all samples; a slow sample is never discarded.
    expect(samples.filter((sample) => sample.milliseconds === undefined || sample.milliseconds >= 100)).toEqual([])
    expect(samples.every((sample) => sample.pendingSnapshotObserved)).toBe(true)
    expectNormalDiagnostics(diagnostics)
    expect(await page.evaluate(() => window.__TASKLY_G2_SYNC_TEST__!.snapshot().registrations)).toBe(3)
  } finally {
    await session.detach()
    await mkdir(QA_DIRECTORY, { recursive: true })
    const result = { source: process.env.TASKLY_SOURCE_HEAD, machine, protocol: 'PHASE-2-PROTOCOL.md: Q14',
      cpuThrottle: 4, initialTaskCount: 1000, diagnostics, samples }
    await writeFile(`${QA_DIRECTORY}/quick-add-20.json`, JSON.stringify(result) + '\n', 'utf8')
    await info.attach('all-quick-add-samples', { body: JSON.stringify(result), contentType: 'application/json' })
  }
})
