import { defineConfig } from '@playwright/test'
import base from '../../playwright.config'
import { resolve } from 'node:path'

const side = process.env.TASKLY_SIDE_ROOT ?? process.cwd()
export default defineConfig({
  ...base,
  testDir: process.env.TASKLY_PROFILE === 'true' ? resolve('tests/diagnostics') : resolve(side, 'tests/e2e'),
  testMatch: process.env.TASKLY_PROFILE === 'true' ? '**/profile.spec.ts' : '**/speed.spec.ts',
  outputDir: process.env.TASKLY_DIAGNOSTIC_OUTPUT,
  use: { ...base.use, baseURL: process.env.TASKLY_SIDE_URL, trace: 'off' },
})
