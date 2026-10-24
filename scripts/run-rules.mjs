import { resolve } from 'node:path'
import { startEmulatorHarness } from './emulator-runner.mjs'

let harness
let failure
try {
  harness = await startEmulatorHarness()
  await harness.run(resolve('node_modules/vitest/vitest.mjs'), [
    'run', '--config', 'vitest.rules.config.ts', ...process.argv.slice(2),
  ])
} catch (error) {
  failure = error
  console.error(error.message)
  process.exitCode = 1
} finally {
  await harness?.stop(failure)
}
