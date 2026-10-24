import { mkdir, writeFile } from 'node:fs/promises'
import { randomUUID } from 'node:crypto'
import { expect, type Page } from '@playwright/test'
import { createRulesEnvironment, type RulesDb } from '../../rules/fixtures'
import { EMULATOR_HOST, EMULATOR_PORTS } from '../../../src/lib/firebase/emulator-config'
import { QA_DIRECTORY } from './qa'
import { openGooglePopup } from './auth'

export type SyncSnapshot = ReturnType<NonNullable<Window['__TASKLY_G2_SYNC_TEST__']>['snapshot']>
interface Diagnostic { kind: string; text: string; url?: string; at: number }
export const FIRESTORE_ROUTE = new RegExp(`^http://${EMULATOR_HOST.replaceAll('.', '\\.')}:${EMULATOR_PORTS.firestore}/`)

export async function syncSnapshot(page: Page): Promise<SyncSnapshot> {
  return page.evaluate(() => {
    const observer = window.__TASKLY_G2_SYNC_TEST__
    if (!observer) throw new Error('The e2e sync observer is not installed')
    return observer.snapshot()
  })
}

export async function waitForSync(page: Page, expected: Partial<SyncSnapshot>) {
  await page.waitForFunction(() => !!window.__TASKLY_G2_SYNC_TEST__, undefined, { timeout: 15_000 })
  await expect.poll(() => syncSnapshot(page), { timeout: 15_000 }).toMatchObject(expected)
}

export async function externalWrite(uid: string, write: (database: RulesDb, path: string) => Promise<unknown>) {
  if (!uid || uid.includes('/')) throw new Error('An isolated emulator UID is required')
  const environment = await createRulesEnvironment({ loadRules: false })
  try {
    await environment.withSecurityRulesDisabled(async (context) => { await write(context.firestore(), `users/${uid}`) })
  } finally { await environment.cleanup() }
}

export async function navigate(page: Page, route: string) {
  if (route.startsWith('/projects/') && (page.viewportSize()?.width ?? 1280) < 820) {
    await page.getByRole('button', { name: 'Open menu' }).click()
  }
  await page.locator(`a[href="${route}"]:visible`).first().click()
  await expect(page).toHaveURL(new RegExp(`${route.replaceAll('/', '\\/')}$`))
}

export async function capture(page: Page, name: string) {
  await page.evaluate(() => document.fonts.ready)
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  await mkdir(QA_DIRECTORY, { recursive: true })
  await page.screenshot({ path: `${QA_DIRECTORY}/${name}-${page.viewportSize()?.width}.png`, fullPage: true })
}

export function collectDiagnostics(page: Page) {
  const messages: Diagnostic[] = []
  page.on('pageerror', (error) => messages.push({ kind: 'pageerror', text: error.message, at: Date.now() }))
  page.on('console', (message) => {
    if (message.type() === 'error') messages.push({
      kind: 'console', text: message.text(), url: message.location().url, at: Date.now(),
    })
  })
  page.on('requestfailed', (request) => messages.push({
    kind: 'requestfailed', text: request.failure()?.errorText ?? 'Request failed', url: request.url(), at: Date.now(),
  }))
  page.on('response', (response) => {
    if (response.status() >= 400) messages.push({
      kind: 'http', text: String(response.status()), url: response.url(), at: Date.now(),
    })
  })
  return messages
}

export function expectNormalDiagnostics(messages: Diagnostic[], offline = false) {
  const unexpected = messages.filter((message) => {
    // Closing/reloading a watched document cancels its established WebChannel request.
    if (message.kind === 'requestfailed' && message.text === 'net::ERR_ABORTED'
      && message.url && FIRESTORE_ROUTE.test(message.url)) return false
    if (!offline || message.kind === 'pageerror') return true
    return !(message.url && FIRESTORE_ROUTE.test(message.url))
      && !(message.kind === 'console' && /(?:Cloud Firestore|Firestore.*(?:offline|backend|connection)|WebChannel)/i.test(message.text))
  })
  expect(unexpected).toEqual([])
}

export async function trackDataStates(page: Page) {
  await page.addInitScript(() => {
    const states: string[] = []
    Object.defineProperty(window, '__tasklyObservedStates', { value: states })
    new MutationObserver(() => {
      const state = document.querySelector('[data-data-state]')?.getAttribute('data-data-state')
      if (state && state !== states.at(-1)) states.push(state)
    }).observe(document, { childList: true, subtree: true, attributes: true, attributeFilter: ['data-data-state'] })
  })
}

export async function observedDataStates(page: Page): Promise<string[]> {
  return page.evaluate(() => (window as typeof window & { __tasklyObservedStates?: string[] }).__tasklyObservedStates ?? [])
}

export async function saveObservation(page: Page, name: string, messages: Diagnostic[], extra: unknown = {}) {
  const observation = await page.evaluate(() => {
    const observer = window.__TASKLY_G2_SYNC_TEST__
    return observer ? { snapshot: observer.snapshot(), events: observer.events, startedAt: observer.startedAt,
      firstDataAt: observer.firstDataAt, firstDataPaintAt: observer.firstDataPaintAt } : null
  })
  await mkdir(QA_DIRECTORY, { recursive: true })
  await writeFile(`${QA_DIRECTORY}/${name}-${page.viewportSize()?.width}.json`, '{\n'
    + Object.entries({ observation, messages, extra }).map(([key, value]) =>
      `  ${JSON.stringify(key)}: ${JSON.stringify(value)}`).join(',\n') + '\n}\n')
}

export async function signOut(page: Page) {
  if ((page.viewportSize()?.width ?? 1280) < 820) {
    await page.getByRole('button', { name: 'Open menu' }).click()
    await page.getByRole('dialog', { name: 'Menu' }).getByRole('button', { name: 'Sign out' }).click()
  } else await page.locator('aside').getByRole('button', { name: 'Sign out' }).click()
  await expect(page.getByRole('button', { name: 'Continue with Google' })).toBeVisible()
}

export async function signInAnotherAccount(page: Page, { confirmed = true } = {}): Promise<string> {
  const popup = await openGooglePopup(page)
  await popup.locator('#email-input').fill(`taskly-switch-${randomUUID()}@example.test`)
  await popup.locator('#display-name-input').fill('Second Taskly Owner')
  const closed = popup.waitForEvent('close')
  await popup.locator('#sign-in').click()
  await closed
  if (confirmed) await waitForSync(page, { dataReady: true, activeHandles: 3 })
  else await page.waitForFunction(() => {
    const state = window.__TASKLY_G2_SYNC_TEST__?.snapshot()
    return state?.uid && state.activeHandles === 3
  })
  const uid = (await syncSnapshot(page)).uid
  if (!uid) throw new Error('The second Google account did not resolve')
  return uid
}
