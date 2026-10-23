import { EMULATOR_HOST, EMULATOR_PORTS, EMULATOR_PROJECT_ID } from '../src/lib/firebase/emulator-config.ts'

export const EMULATOR_STARTUP_TIMEOUT_MS = 90_000

function assertRunning(child) {
  if (child.startError) throw child.startError
  if (child.exitCode !== null || child.signalCode !== null) {
    throw new Error(`Emulator CLI exited before readiness (exit ${child.exitCode}, signal ${child.signalCode})`)
  }
}

async function waitForProbes(child, timing, probes, runtime = {}) {
  const now = runtime.now ?? Date.now
  const fetchResponse = runtime.fetch ?? globalThis.fetch
  const delay = runtime.delay ?? ((ms) => new Promise((done) => setTimeout(done, ms)))
  const deadline = timing.spawnedAtMs + timing.timeoutMs
  timing.services ??= {}
  for (const probe of probes) {
    timing.services[probe.name] = { url: probe.url, readyMs: null, attempts: [] }
  }
  while (now() < deadline) {
    assertRunning(child)
    await Promise.all(probes.filter((probe) => timing.services[probe.name].readyMs === null)
      .map(async (probe) => {
        const service = timing.services[probe.name]
        let result
        try {
          const response = await fetchResponse(probe.url, {
            headers: probe.headers,
            signal: AbortSignal.timeout(Math.max(1, Math.min(1000, deadline - now()))),
          })
          const body = probe.text ? await response.text() : await response.json()
          const valid = response.status === 200 && probe.accept(body)
          result = `HTTP ${response.status}; ${valid ? 'valid service response' : 'unexpected service response'}`
          if (valid && now() < deadline) service.readyMs = now() - timing.spawnedAtMs
        } catch (error) {
          result = error.cause?.code ?? error.message
        }
        service.lastProbe = result
        service.attempts.push({ elapsedMs: now() - timing.spawnedAtMs, result })
      }))
    assertRunning(child)
    if (probes.every((probe) => timing.services[probe.name].readyMs !== null)) {
      timing.readyMs = now() - timing.spawnedAtMs
      return timing.readyMs
    }
    await delay(Math.max(0, Math.min(200, deadline - now())))
  }
  const responses = probes.map(({ name }) => `${name}: ${timing.services[name].lastProbe}`).join('; ')
  throw new Error(`Services did not start within shared ${timing.timeoutMs} ms deadline; ${responses}`)
}

export function waitForEmulators(child, timing, runtime) {
  return waitForProbes(child, timing, [{
    name: 'auth',
    url: `http://${EMULATOR_HOST}:${EMULATOR_PORTS.auth}/emulator/v1/projects/${EMULATOR_PROJECT_ID}/config`,
    accept: (body) => typeof body?.signIn?.allowDuplicateEmails === 'boolean',
  }, {
    name: 'firestore',
    url: `http://${EMULATOR_HOST}:${EMULATOR_PORTS.firestore}/v1/projects/${EMULATOR_PROJECT_ID}/databases/(default)/documents/tasklyReadiness?pageSize=1`,
    headers: { Authorization: 'Bearer owner' },
    accept: (body) => body !== null && typeof body === 'object' && !Array.isArray(body)
      && !body.error && (body.documents === undefined || Array.isArray(body.documents)),
  }], runtime)
}

export function waitForApp(child, url) {
  return waitForProbes(child, { spawnedAtMs: Date.now(), timeoutMs: EMULATOR_STARTUP_TIMEOUT_MS }, [{
    name: 'app', url, text: true, accept: (body) => /<(?:!doctype|html)\b/i.test(body),
  }])
}
