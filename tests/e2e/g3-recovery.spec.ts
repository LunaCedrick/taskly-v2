import { test, expect } from '@playwright/test'
import { signIn } from './fixtures/auth'
import { seedUser } from './fixtures/firestore'
import { externalWrite, navigate, signOut, waitForSync } from './fixtures/sync'
import { network, saveExperiment, signInEmail, writeSnapshot } from './fixtures/writes'

test('G3 rejected UI save retains a recoverable edit and retry succeeds against emulator rules', async ({ page }, info) => {
  const uid = await signIn(page, '/', { seed: false })
  await seedUser(uid, { taskCount: 1 })
  await waitForSync(page, { tasks: 1 })
  await navigate(page, '/projects/project-1')
  const task = (await writeSnapshot(page)).tasks[0]
  const recoveredTitle = 'Recover this rejected UI edit'
  await page.getByRole('button', { name: `Edit ${task.title}`, exact: true }).click()
  const dialog = page.getByRole('dialog')
  await dialog.getByLabel('Title').fill(recoveredTitle)
  // E2E-only instrumentation changes createdAt on this update; real owner rules reject it.
  // The production write and retained retry plan are untouched.
  await page.evaluate(() => window.__TASKLY_G3_WRITES_TEST__!.rejectNextTaskUpdate())
  await dialog.getByRole('button', { name: 'Save changes' }).click()
  const failure = page.getByRole('alert').filter({ hasText: 'Could not save your change' })
  await expect(failure).toBeVisible()
  await expect.poll(async () => (await writeSnapshot(page)).tasks[0].title).toBe(task.title)
  await failure.getByRole('button', { name: 'Recover draft' }).click()
  await expect(dialog.getByRole('heading', { name: 'Edit task' })).toBeVisible()
  await expect(dialog.getByLabel('Title')).toHaveValue(recoveredTitle)
  await dialog.getByRole('button', { name: 'Save changes' }).click()
  await expect.poll(async () => {
    let title: unknown
    await externalWrite(uid, async (database, path) => {
      title = (await database.doc(`${path}/tasks/${task.id}`).get()).get('title')
    })
    return title
  }).toBe(recoveredTitle)
  await expect(page.getByRole('button', { name: `Edit ${recoveredTitle}`, exact: true })).toBeVisible()
  await expect(failure).toHaveCount(0)
  await waitForSync(page, { activeHandles: 3, dataReady: true })
  await saveExperiment(info, 'g3-ui-rejected-save-recovery', {
    rejection: 'Real immutable-createdAt rule, injected only into the first emulator transport update',
    recoveredTitle, taskId: task.id, serverRetry: 'acknowledged', listeners: 3,
  })
})

test('G3 unload guard remains active after sign-out until the original SDK queued write settles', async ({ page }, info) => {
  await signIn(page)
  const email = (await writeSnapshot(page)).email!
  await navigate(page, '/projects/project-empty')
  await network(page, false) // SDK disableNetwork; browser and Auth remain online.
  await page.getByRole('button', { name: 'Quick Add', exact: true }).click()
  const title = page.getByRole('dialog').getByLabel('Title')
  await title.fill('Queued through sign-out')
  await title.press('Enter')
  await expect.poll(async () => (await writeSnapshot(page)).tasks.length).toBe(1001)
  await title.press('Escape')
  await signOut(page)
  await expect(page.getByRole('button', { name: 'Continue with Google' })).toBeVisible()
  await expect(page.getByRole('dialog')).toHaveCount(0)
  const activeAfterSignOut = await page.evaluate(() => {
    const event = new Event('beforeunload', { cancelable: true })
    window.dispatchEvent(event)
    return event.defaultPrevented
  })
  expect(activeAfterSignOut).toBe(true)
  await network(page, true)
  await signInEmail(page, email)
  await expect.poll(async () => page.evaluate(() => {
    const event = new Event('beforeunload', { cancelable: true })
    window.dispatchEvent(event)
    return event.defaultPrevented
  })).toBe(false)
  await expect.poll(async () => (await writeSnapshot(page)).tasks.some((task) => task.title === 'Queued through sign-out')).toBe(true)
  await saveExperiment(info, 'g3-pending-unload-after-sign-out', {
    offline: 'Firestore SDK disableNetwork; Auth reachable', activeAfterSignOut,
    signOutConfirmation: false, activeAfterOriginalQueueSettled: false,
  })
})
