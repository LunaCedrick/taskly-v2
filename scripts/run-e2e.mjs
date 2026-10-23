import { resolve } from 'node:path'
import { startEmulatorHarness } from './emulator-runner.mjs'

const args = process.argv.slice(2).filter((argument) => argument !== '--record-evidence')
let harness
let failure
try {
  harness = await startEmulatorHarness({ recordEvidence: process.argv.includes('--record-evidence') })
  await harness.build()
  await harness.serve()
  await harness.run(resolve('node_modules/@playwright/test/cli.js'), [
    'test', ...(args.length ? args : ['--grep-invert', '@comparison']),
  ])
} catch (error) {
  failure = error
  console.error(error.message)
  process.exitCode = 1
} finally {
  await harness?.stop(failure)
}
