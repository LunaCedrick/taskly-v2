import { defineConfig } from '@playwright/test'
import base from '../../playwright.config'

export default defineConfig({
  ...base,
  testDir: '.',
  testMatch: 'quick-add.spec.ts',
  use: { ...base.use, trace: 'off' },
})
