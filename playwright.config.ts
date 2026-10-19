import { defineConfig } from '@playwright/test'

if (process.env.TASKLY_E2E_MANAGED !== 'true') {
  throw new Error('Run browser tests through npm run e2e so the demo Auth emulator is coordinated')
}

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 45_000,
  reporter: 'list',
  outputDir: './test-results/playwright',
  use: {
    baseURL: 'http://127.0.0.1:4173',
    browserName: 'chromium',
    viewport: { width: 1280, height: 900 },
    timezoneId: 'Asia/Shanghai',
    trace: 'retain-on-failure',
  },
})
