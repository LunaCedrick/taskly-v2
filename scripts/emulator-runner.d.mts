export interface ServiceTiming {
  url: string
  readyMs: number | null
  lastProbe?: string
  attempts: { elapsedMs: number; result: string }[]
}

export interface ReadinessTiming {
  spawnedAtMs: number
  timeoutMs: number
  readyMs?: number | null
  services?: Record<string, ServiceTiming>
}

export interface ProcessState {
  exitCode: number | null
  signalCode: string | null
  startError?: Error
}

export interface ProbeRuntime {
  now?: () => number
  delay?: (ms: number) => Promise<void>
  fetch?: (url: string, init?: { headers?: Record<string, string>; signal?: AbortSignal }) => Promise<{
    status: number
    json(): Promise<unknown>
    text?(): Promise<string>
  }>
}

export interface EmulatorHarness {
  environment: NodeJS.ProcessEnv
  diagnosticsDirectory: string
  startup: {
    status: string
    timeoutMs: number
    spawnedAtMs: number | null
    firstOutputMs: number | null
    readyMs: number | null
    services: Record<string, ServiceTiming>
  }
  run(script: string, args: string[]): Promise<void>
  build(): Promise<string>
  serve(options?: { port?: number; outDir?: string }): Promise<string>
  stop(error?: Error): Promise<void>
}

export const EMULATOR_STARTUP_TIMEOUT_MS: number
export function requireJava21(output: string): number
export function emulatorEnvironment(recordEvidence?: boolean): NodeJS.ProcessEnv
export function waitForEmulators(child: ProcessState, timing: ReadinessTiming, runtime?: ProbeRuntime): Promise<number>
export function startEmulatorHarness(options?: { root?: string; recordEvidence?: boolean }): Promise<EmulatorHarness>
