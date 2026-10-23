import { test, expect } from '@playwright/test'
import { mkdir, writeFile } from 'node:fs/promises'
import { signIn } from './fixtures/auth'
import { QA_DIRECTORY } from './fixtures/qa'
import { captureStartupNetwork } from './fixtures/startup-network'

test.use({ trace: 'off' })

// Chrome DevTools' named Slow 4G profile, including its protocol adjustment factors.
// G1 recorded the preset name, not separate numeric settings.
const profile = { offline: false, downloadThroughput: 180_000, uploadThroughput: 84_375, latency: 562.5 }
const profileSource = 'https://chromium.googlesource.com/devtools/devtools-frontend/+/HEAD/front_end/core/sdk/NetworkManager.ts'

test('signed-in startup transfer and first-data latency: Slow 4G / 4x CPU', async ({ page }, testInfo) => {
  test.setTimeout(90_000)
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()) })
  const uid = await signIn(page)
  const session = await page.context().newCDPSession(page)
  await session.send('Network.enable')
  await session.send('Network.clearBrowserCache')
  await session.send('Network.setCacheDisabled', { cacheDisabled: true })
  await session.send('Network.emulateNetworkConditions', profile)
  await session.send('Emulation.setCPUThrottlingRate', { rate: 4 })
  const network = captureStartupNetwork(session)
  await page.reload({ waitUntil: 'domcontentloaded' })
  await page.waitForFunction(() => !!window.__TASKLY_G2_SYNC_TEST__?.firstDataPaintAt, undefined, { timeout: 60_000 })
  const timing = await page.evaluate(() => {
    const observer = window.__TASKLY_G2_SYNC_TEST__!
    return { authResolvedAt: observer.startedAt, dataAt: observer.firstDataAt!, paintAt: observer.firstDataPaintAt!,
      firstPaintRows: observer.firstPaintRows,
      navigationAt: performance.timeOrigin, snapshot: observer.snapshot(), events: observer.events }
  })
  // Drain delivery without moving the fixed endpoint used for timestamps/byte clipping.
  await page.waitForTimeout(200)
  const captured = await network.through(timing.navigationAt, timing.paintAt)
  const transfer = captured.reduce((bytes, request) => bytes + request.encodedThroughPaint, 0)
  const result = { phase: 'final-ui-follow-up', capturedAt: new Date().toISOString(), profile, profileSource,
    cpuThrottle: 4, browser: page.context().browser()?.version(), viewport: page.viewportSize(),
    account: 'Persisted demo Google account; provider interaction completed before throttled reload',
    cache: 'Cold HTTP cache; persisted Auth only; new memory-only Firestore instance on reload',
    signedInToDataMs: timing.dataAt - timing.authResolvedAt,
    signedInToDataPaintMs: timing.paintAt - timing.authResolvedAt,
    navigationToDataPaintMs: Math.round(timing.paintAt - timing.navigationAt),
    startupEncodedTransferBytes: transfer,
    transferMethod: 'Observed encoded bytes through the fixed two-frame readiness paint endpoint; headers included for completed responses, omitted for unfinished transports (wire-transfer lower bound). Per-response Content-Encoding is retained; includes e2e instrumentation and emulator transport, not a Production timing claim.',
    ...timing, requests: captured, errors }
  await mkdir(QA_DIRECTORY, { recursive: true })
  await writeFile(`${QA_DIRECTORY}/startup-final.json`, '{\n' + Object.entries(result)
    .map(([key, value]) => `  ${JSON.stringify(key)}: ${JSON.stringify(value)}`).join(',\n') + '\n}\n')
  console.log(JSON.stringify({ signedInToDataMs: result.signedInToDataMs,
    signedInToDataPaintMs: result.signedInToDataPaintMs, navigationToDataPaintMs: result.navigationToDataPaintMs,
    startupEncodedTransferBytes: transfer, state: timing.snapshot, errors }, null, 2))
  await testInfo.attach('startup-follow-up', { body: JSON.stringify(result), contentType: 'application/json' })
  expect(timing.snapshot.uid).toBe(uid)
  expect(timing.snapshot.dataReady).toBe(true)
  expect(timing.snapshot.tasks).toBe(1000)
  expect(timing.firstPaintRows).toBeGreaterThan(0)
  expect(timing.snapshot.handles).toBe(3)
  expect(timing.snapshot.activeHandles).toBe(3)
  expect(errors).toEqual([])
  await session.detach()
})
