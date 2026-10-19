import { mkdir } from 'node:fs/promises'
import { test, expect, type Page } from '@playwright/test'
import { openGooglePopup, signIn } from './fixtures/auth'
import { QA_DIRECTORY } from './fixtures/qa'

const errors = new WeakMap<Page, string[]>()
test.beforeEach(async ({ page }) => {
  const messages: string[] = []
  errors.set(page, messages)
  page.on('pageerror', (error) => messages.push(error.message))
  page.on('console', (message) => { if (message.type() === 'error') messages.push(message.text()) })
  await mkdir(QA_DIRECTORY, { recursive: true })
})
test.afterEach(async ({ page }) => { expect(errors.get(page)).toEqual([]) })

for (const destination of ['/', '/tasks', '/projects/project-1?sort=due#task-2']) {
  test(`Google emulator sign-in returns to ${destination}`, async ({ page }) => {
    await signIn(page, destination)
    expect(new URL(page.url()).pathname + new URL(page.url()).search + new URL(page.url()).hash).toBe(destination)
    await expect(page.getByText('Taskly Test Owner').first()).toBeVisible()
    await expect(page.getByRole('button', { name: 'Continue with Google' })).toHaveCount(0)
  })
}

test('refresh persists Google authentication and rejects the sign-in route', async ({ page }) => {
  await signIn(page, '/tasks')
  await page.reload()
  await expect(page.locator('[data-view="tasks"]')).toBeVisible()
  await page.goto('/sign-in?returnTo=%2Fprojects%2Fproject-1')
  await expect(page.locator('[data-view="project"]')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Continue with Google' })).toHaveCount(0)
  await page.goto('/sign-in?returnTo=https%3A%2F%2Fexample.com')
  await expect(page.locator('[data-view="dashboard"]')).toBeVisible()
})

test('successful sign-in replaces its history entry', async ({ page }) => {
  await page.goto('/sign-in')
  await signIn(page, '/tasks')
  await page.goBack()
  await expect(page.locator('[data-view="dashboard"]')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Continue with Google' })).toHaveCount(0)
})

for (const width of [390, 1280]) {
  test(`sign-out removes authenticated access at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: width === 390 ? 844 : 900 })
    await signIn(page)
    if (width === 390) {
      await page.getByRole('button', { name: 'Open menu' }).click()
      await page.getByRole('dialog', { name: 'Menu' }).getByRole('button', { name: 'Sign out' }).click()
    } else {
      await page.locator('aside').getByRole('button', { name: 'Sign out' }).click()
    }
    await expect(page.getByRole('button', { name: 'Continue with Google' })).toBeVisible()
    await expect(page.locator('[data-view]')).toHaveCount(0)
    await page.goto('/tasks')
    await expect(page.getByRole('button', { name: 'Continue with Google' })).toBeVisible()
    await page.reload()
    await expect(page.getByRole('button', { name: 'Continue with Google' })).toBeVisible()
  })

  test(`sign-in layout, keyboard and reduced motion at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: width === 390 ? 844 : 900 })
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.goto('/sign-in')
    const button = page.getByRole('button', { name: 'Continue with Google' })
    await expect(button).toBeVisible()
    await page.evaluate(() => document.fonts.ready)
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
    await expect(page.getByRole('complementary', { name: 'Why Taskly' })).toBeVisible({ visible: width === 1280 })
    await page.keyboard.press('Tab')
    await expect(button).toBeFocused()
    const target = await button.evaluate((element) => ({
      width: element.getBoundingClientRect().width, height: element.getBoundingClientRect().height,
      outline: parseFloat(getComputedStyle(element).outlineWidth),
    }))
    expect(target.width).toBeGreaterThanOrEqual(44)
    expect(target.height).toBeGreaterThanOrEqual(44)
    expect(target.outline).toBeGreaterThanOrEqual(3)
    await page.screenshot({ path: `${QA_DIRECTORY}/sign-in-${width}.png`, fullPage: true })
  })

  for (const [name, code, message] of [
    ['popup-blocked', 'auth/popup-blocked', 'Sign-in failed: the popup was blocked. Allow popups for this site and try again.'],
    ['network', 'auth/network-request-failed', 'Sign-in failed: no connection. Check your network and try again.'],
    ['generic', 'auth/unknown', 'Sign-in failed: something went wrong. Try again.'],
  ]) {
    test(`${name} alert and retry at ${width}px`, async ({ page }) => {
      // Browser boundary fault injection; no production test route or auth bypass.
      await page.addInitScript((failureCode) => {
        window.open = () => {
          if (failureCode === 'auth/popup-blocked') return null
          throw Object.assign(new Error('Test popup failure'), { code: failureCode })
        }
      }, code)
      await page.setViewportSize({ width, height: width === 390 ? 844 : 900 })
      await page.goto('/sign-in')
      const button = page.getByRole('button', { name: 'Continue with Google' })
      await button.click()
      await expect(page.getByRole('alert')).toHaveText(message)
      await expect(button).toBeEnabled()
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
      await page.screenshot({ path: `${QA_DIRECTORY}/sign-in-${name}-${width}.png`, fullPage: true })
      await button.click()
      await expect(page.getByRole('alert')).toHaveText(message)
      await expect(button).toBeEnabled()
    })
  }

  test(`session check hides the form and shell during persisted-user lookup at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: width === 390 ? 844 : 900 })
    await signIn(page)
    let release!: () => void
    const held = new Promise<void>((done) => { release = done })
    await page.route('**/identitytoolkit.googleapis.com/v1/accounts:lookup*', async (route) => {
      await held
      await route.continue()
    })
    try {
      await page.reload({ waitUntil: 'domcontentloaded' })
      await expect(page.getByRole('status')).toHaveText('TasklyGetting your tasks ready')
      await expect(page.locator('[data-view]')).toHaveCount(0)
      await expect(page.getByRole('button', { name: 'Continue with Google' })).toHaveCount(0)
      await page.evaluate(() => document.fonts.ready)
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
      await page.screenshot({ path: `${QA_DIRECTORY}/session-check-${width}.png`, fullPage: true })
    } finally {
      release()
    }
    await expect(page.locator('[data-view="dashboard"]')).toBeVisible()
  })
}

for (const width of [390, 1280]) {
test(`closing the Google popup announces cancellation and permits retry at ${width}px`, async ({ page }) => {
  await page.setViewportSize({ width, height: width === 390 ? 844 : 900 })
  await page.goto('/sign-in')
  const popup = await openGooglePopup(page)
  await popup.close()
  // The Firebase SDK deliberately gives an in-flight auth event 8 seconds after
  // detecting window closure before rejecting with popup-closed-by-user.
  await expect(page.getByRole('alert')).toHaveText("Sign-in was cancelled. Try again when you're ready.", { timeout: 15_000 })
  await expect(page.getByRole('button', { name: 'Continue with Google' })).toBeEnabled()
  await page.screenshot({ path: `${QA_DIRECTORY}/sign-in-cancelled-${width}.png`, fullPage: true })
  const retry = await openGooglePopup(page)
  await retry.close()
  await expect(page.getByRole('button', { name: 'Continue with Google' })).toBeEnabled({ timeout: 15_000 })
})
}
