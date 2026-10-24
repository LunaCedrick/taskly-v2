import { gzipSync } from 'node:zlib'
import type { CDPSession } from '@playwright/test'
import { safeRequestUrl } from './network'

interface Request {
  id: string; url: string; type: string; start: number; responseAt: number | null;
  encoded: number | null; finishedAt: number | null;
  samples: { at: number; bytes: number }[]; fromDiskCache: boolean; encoding: string | null;
  buffered: string; bodies: { at: number; data: string }[]; captureError?: string
}

/** Passive CDP observation only: no interception, SDK preload, or transport replacement. */
export function captureStartupNetwork(session: CDPSession) {
  const requests = new Map<string, Request>()
  const pending: Promise<void>[] = []
  let epochOffset = 0
  session.on('Network.requestWillBeSent', (event) => {
    epochOffset = (event.wallTime - event.timestamp) * 1000
    requests.set(event.requestId, { id: event.requestId, url: event.request.url,
      type: event.type ?? '', start: event.wallTime * 1000, responseAt: null,
      encoded: null, finishedAt: null, samples: [], fromDiskCache: false, encoding: null,
      buffered: '', bodies: [] })
  })
  session.on('Network.responseReceived', (event) => {
    const request = requests.get(event.requestId)
    if (!request) return
    request.responseAt = event.timestamp * 1000 + epochOffset
    request.fromDiskCache = event.response.fromDiskCache ?? false
    request.encoding = String(event.response.headers['Content-Encoding']
      ?? event.response.headers['content-encoding'] ?? '') || null
    const url = new URL(request.url)
    if (url.port === '8081' && url.searchParams.get('RID') === 'rpc') {
      pending.push(session.send('Network.streamResourceContent', { requestId: event.requestId })
        .then(({ bufferedData }) => { request.buffered = bufferedData })
        .catch((error: Error) => { request.captureError = error.message }))
    }
  })
  session.on('Network.dataReceived', (event) => {
    const request = requests.get(event.requestId)
    if (!request) return
    const at = event.timestamp * 1000 + epochOffset
    request.samples.push({ at, bytes: event.encodedDataLength })
    if (event.data) request.bodies.push({ at, data: event.data })
  })
  session.on('Network.loadingFinished', (event) => {
    const request = requests.get(event.requestId)
    if (request) {
      request.encoded = event.encodedDataLength
      request.finishedAt = event.timestamp * 1000 + epochOffset
    }
  })
  return { async through(navigationAt: number, paintAt: number) {
    await Promise.all(pending)
    return [...requests.values()].filter((request) => request.start >= navigationAt
      && request.start <= paintAt).map((request) => {
      const { buffered, bodies, ...metadata } = request
      const payload = Buffer.concat([Buffer.from(buffered, 'base64'),
        ...bodies.filter((sample) => sample.at <= paintAt).map((sample) => Buffer.from(sample.data, 'base64'))])
      return { ...metadata, url: safeRequestUrl(request.url),
        encodedThroughPaint: request.finishedAt !== null && request.finishedAt <= paintAt
          ? request.encoded! : request.samples.filter((sample) => sample.at <= paintAt)
            .reduce((bytes, sample) => bytes + sample.bytes, 0),
        ...(payload.length ? { compressionEstimate: { payloadBytes: payload.length,
          gzipBytes: gzipSync(payload).length, gzipLevel: 'Node default (6)',
          method: 'Recompress captured decoded WebChannel bytes as one gzip stream; estimate only, not Production wire bytes.' } } : {}),
      }
    })
  } }
}
