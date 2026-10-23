import { createHash } from 'node:crypto'
import type { CDPSession } from '@playwright/test'

export interface NetworkStart {
  id: string
  url: string
  start: number
  end: number | null
  method: string
  kind: string
  firestore: boolean
  sid: string | null
}
const hash = (value: string) => createHash('sha256').update(value).digest('hex').slice(0, 12)

export function safeRequestUrl(raw: string): string {
  const url = new URL(raw)
  for (const key of [...url.searchParams.keys()]) {
    if (/token|authorization|key|\$httpheaders/i.test(key)) url.searchParams.set(key, '<redacted>')
    if (/^(?:SID|gsessionid)$/i.test(key)) url.searchParams.set(key, hash(url.searchParams.get(key)!))
  }
  return url.toString()
}

export function networkSummary(request: NetworkStart) {
  return { id: request.id, url: safeRequestUrl(request.url), start: request.start, end: request.end,
    method: request.method, kind: request.kind, session: request.sid ? hash(request.sid) : null }
}

export function trackNetwork(session: CDPSession) {
  const requests: NetworkStart[] = []
  const byId = new Map<string, NetworkStart>()
  let offset = 0
  session.on('Network.requestWillBeSent', (event) => {
    offset = (event.wallTime - event.timestamp) * 1000
    const url = new URL(event.request.url)
    const firestore = url.port === '8081' && url.pathname.includes('Firestore/Listen/channel')
    const rid = url.searchParams.get('RID')
    const request: NetworkStart = { id: event.requestId, url: event.request.url,
      start: event.wallTime * 1000, end: null, method: event.request.method, firestore,
      sid: firestore ? url.searchParams.get('SID') : null,
      kind: `${event.request.method} ${url.pathname} ${rid === 'rpc' ? 'backchannel' : 'forward'}` }
    requests.push(request)
    byId.set(request.id, request)
  })
  const finish = (event: { requestId: string; timestamp: number }) => {
    const request = byId.get(event.requestId)
    if (request) request.end = event.timestamp * 1000 + offset
  }
  session.on('Network.loadingFinished', finish)
  session.on('Network.loadingFailed', finish)
  return requests
}

export function attributeWindow(requests: readonly NetworkStart[], start: number, end: number,
  idleKinds: ReadonlySet<string>) {
  const known = new Set(requests.filter((request) => request.start < start && request.sid)
    .map((request) => request.sid!))
  const inFlight = requests.filter((request) => request.start < start && (request.end === null || request.end >= start))
  const started = requests.filter((request) => request.start >= start && request.start <= end)
  return { start, end, inFlightBeforeClick: inFlight.map(networkSummary),
    requests: started.map((request) => ({ ...networkSummary(request), attribution:
      !request.firestore ? 'navigation-request-or-UNVERIFIED'
        : !request.sid || !known.has(request.sid) ? 'new-Firestore-channel'
          : idleKinds.has(request.kind) ? 'established-idle-transport' : 'UNVERIFIED' })) }
}
