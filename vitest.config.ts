import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['tests/setup.ts'],
    include: ['tests/unit/**/*.test.{ts,tsx}'],
    // Frozen G2-only adapter probe; G3 measures its actual production graph instead.
    exclude: ['tests/unit/firestore-measurement.test.ts'],
    // Avoid concurrent cold jsdom/Vite worker startup on the owner's Windows host.
    fileParallelism: false,
    maxWorkers: 1,
    restoreMocks: true,
  },
})
