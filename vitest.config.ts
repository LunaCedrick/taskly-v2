import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

const shared = {
  environment: 'jsdom' as const,
  setupFiles: ['tests/setup.ts'],
  restoreMocks: true,
}

export default defineConfig({ test: {
  // Avoid concurrent cold jsdom/Vite worker startup on the owner's Windows host.
  fileParallelism: false,
  maxWorkers: 1,
  projects: [
    { plugins: [react()], test: { ...shared, name: 'unit', include: ['tests/unit/**/*.test.{ts,tsx}'],
      // Frozen G2 probe is not a G3 exit; DST runs exactly once in the project below.
      exclude: ['tests/unit/firestore-measurement.test.ts', 'tests/unit/task-dates-dst.test.ts'] } },
    { plugins: [react()], test: { ...shared, name: 'dates-new-york', pool: 'forks',
      include: ['tests/unit/task-dates-dst.test.ts'], env: { TZ: 'America/New_York' } } },
  ],
} })
