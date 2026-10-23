import { randomUUID } from 'node:crypto'
import { test as base, expect, type Page } from '@playwright/test'
import { seedUser } from './firestore'

export { expect }

export async function openGooglePopup(page: Page) {
  const opened = page.waitForEvent('popup')
  await page.getByRole('button', { name: 'Continue with Google' }).click()
  const popup = await opened
  // The emulator renders its markup before its blocking widget scripts finish.
  // Wait for their handlers before clicking Add new account.
  await popup.waitForURL(/\/emulator\/auth\/handler/, { waitUntil: 'domcontentloaded' })
  await popup.locator('#add-account-button').click()
  return popup
}

export async function signIn(page: Page, destination = '/', { seed = true } = {}) {
  await page.goto(destination)
  await expect(page.getByRole('button', { name: 'Continue with Google' })).toBeVisible()
  const popup = await openGooglePopup(page)
  await popup.locator('#email-input').fill(`taskly-${randomUUID()}@example.test`)
  await popup.locator('#display-name-input').fill('Taskly Test Owner')
  const closed = popup.waitForEvent('close')
  await popup.locator('#sign-in').click()
  await closed
  await expect(page.locator('[data-view]')).toBeVisible()
  await page.waitForFunction(() => !!window.__TASKLY_G2_SYNC_TEST__?.snapshot().uid)
  const uid = await page.evaluate(() => window.__TASKLY_G2_SYNC_TEST__!.snapshot().uid!)
  if (seed) await seedUser(uid)
  await page.waitForFunction((count) => {
    const state = window.__TASKLY_G2_SYNC_TEST__?.snapshot()
    return state?.dataReady && (!count || state.tasks === 1000) && state.activeHandles === 3
  }, seed)
  await page.evaluate(() => document.fonts.ready)
  return uid
}

export const test = base.extend<{ authenticated: void }>({
  authenticated: [async ({ page }, use) => {
    const errors: string[] = []
    page.on('pageerror', (error) => errors.push(error.message))
    page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()) })
    await signIn(page)
    await use()
    expect(errors).toEqual([])
  }, { auto: true }],
})
