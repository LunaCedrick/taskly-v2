import { randomUUID } from 'node:crypto'
import { test as base, expect, type Page } from '@playwright/test'

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

export async function signIn(page: Page, destination = '/') {
  await page.goto(destination)
  await expect(page.getByRole('button', { name: 'Continue with Google' })).toBeVisible()
  const popup = await openGooglePopup(page)
  await popup.locator('#email-input').fill(`taskly-${randomUUID()}@example.test`)
  await popup.locator('#display-name-input').fill('Taskly Test Owner')
  const closed = popup.waitForEvent('close')
  await popup.locator('#sign-in').click()
  await closed
  await expect(page.locator('[data-view]')).toBeVisible()
  await page.evaluate(() => document.fonts.ready)
  await page.waitForLoadState('networkidle')
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
