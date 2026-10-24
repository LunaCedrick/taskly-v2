import { expect, test } from './fixtures/auth'
import { mkdir } from 'node:fs/promises'
import { QA_DIRECTORY } from './fixtures/qa'

async function ready(page: import('@playwright/test').Page) {
  await page.waitForFunction(() => {
    const state = window.__TASKLY_G2_SYNC_TEST__?.snapshot()
    return state?.dataReady && state.tasks === 1000 && state.activeHandles === 3
  })
  await page.evaluate(() => document.fonts.ready)
}

for (const width of [390, 1280]) {
  test(`shell, routes, screenshots and keyboard at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: width === 390 ? 844 : 900 })
    const errors: string[] = []
    page.on('pageerror', (error) => errors.push(error.message))
    page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()) })
    page.on('response', (response) => { if (response.status() >= 400) errors.push(`${response.status()} ${response.url()}`) })
    await mkdir(QA_DIRECTORY, { recursive: true })
    for (const [name, route] of [['dashboard', '/'], ['my-tasks', '/tasks'], ['project', '/projects/project-1']]) {
      await page.goto(route)
      await ready(page)
      await expect(page).toHaveTitle('Taskly')
      await expect(page.locator('[data-view]')).toBeVisible()
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
      await page.screenshot({ path: `${QA_DIRECTORY}/${name}-${width}.png`, fullPage: true })
    }
    await page.goto('/')
    await ready(page)
    await expect(page.locator('[data-view="dashboard"]')).toBeVisible()
    const controlCount = await page.evaluate(() => {
      const controls = [...document.querySelectorAll<HTMLElement>('a[href], button, [tabindex="0"]')]
        .filter((element) => element.getBoundingClientRect().width > 0)
      controls.forEach((element, index) => { element.dataset.keyboardCheck = String(index) })
      return controls.length
    })
    const reached = new Set<string>()
    for (let index = 0; index < controlCount + 2; index++) {
      await page.keyboard.press('Tab')
      const focused = await page.evaluate(() => {
        const element = document.activeElement as HTMLElement
        const rect = element.getBoundingClientRect()
        return { id: element.dataset.keyboardCheck, width: rect.width, height: rect.height,
          outline: parseFloat(getComputedStyle(element).outlineWidth) }
      })
      if (focused.id !== undefined) {
        reached.add(focused.id)
        expect(focused.width).toBeGreaterThanOrEqual(44)
        expect(focused.height).toBeGreaterThanOrEqual(44)
        expect(focused.outline).toBeGreaterThanOrEqual(3)
      }
    }
    expect(reached.size).toBe(controlCount)
    await page.goto('/')
    await ready(page)
    await expect(page.locator('[data-view="dashboard"]')).toBeVisible()
    await page.keyboard.press('Tab')
    await expect(page.getByRole('link', { name: 'Skip to content' })).toBeFocused()
    await page.keyboard.press('Enter')
    await expect(page.locator('main')).toBeFocused()
    if (width === 390) {
      await page.getByRole('button', { name: 'Projects', exact: true }).click()
      const dialog = page.getByRole('dialog', { name: 'Menu' })
      await expect(dialog).toBeVisible()
      await page.screenshot({ path: `${QA_DIRECTORY}/drawer-390.png` })
      for (let index = 0; index < 14; index++) {
        await page.keyboard.press('Tab')
        expect(await dialog.evaluate((element) => element.contains(document.activeElement))).toBe(true)
      }
      await page.keyboard.press('Escape')
      await expect(dialog).not.toBeVisible()
      await expect(page.getByRole('button', { name: 'Projects', exact: true })).toBeFocused()
      await page.getByRole('button', { name: 'Open menu' }).click()
      await page.mouse.click(365, 400)
      await expect(dialog).not.toBeVisible()
      await page.getByRole('link', { name: 'Tasks', exact: true }).click()
    } else {
      await page.getByRole('navigation', { name: 'Main navigation' }).getByRole('link', { name: 'My Tasks', exact: true }).click()
    }
    const list = page.getByRole('list', { name: 'All tasks', exact: true })
    await expect(list).toHaveAttribute('data-virtualized', 'true')
    expect(await list.getByRole('listitem').count()).toBeLessThan(30)
    const first = list.getByRole('listitem').first()
    await expect(first).toHaveAttribute('aria-setsize', '1000')
    await first.focus()
    await page.keyboard.press('End')
    await expect(list.locator('[aria-posinset="1000"]')).toBeFocused()
    await list.evaluate((element) => { element.scrollTop = 0 })
    await expect(list.locator('[aria-posinset="1000"]')).toBeFocused()
    await page.keyboard.press('Home')
    await expect(first).toBeFocused()
    await page.keyboard.press('ArrowDown')
    await expect(list.locator('[aria-posinset="2"]')).toBeFocused()
    expect(errors).toEqual([])
  })
}
