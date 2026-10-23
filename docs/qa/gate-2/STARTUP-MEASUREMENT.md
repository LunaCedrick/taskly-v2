# G2 signed-in startup observations — 2026-10-23

The owner chose to continue G2 unchanged. **8.035 s is a measurement, not a pass/fail.** The owner will decide after G2 whether to add a first-data target or mitigation. The lazy loading and three-listener contract are unchanged; no speculative Firestore preloading was added. The owner's empty-account preview check cannot reproduce this 1,000-task case.

## Early step 6 capture

[Original evidence](startup-early.json): real Google emulator sign-in, then cold HTTP-cache reload with persisted Auth, memory-only Firestore, 1,000 tasks, four projects and latest 20 activity records. Chrome DevTools Slow 4G (180,000 B/s down, 84,375 B/s up, 562.5 ms protocol latency) and 4× CPU. Tracing off. Two frames after confirmed-data publication, six task rows were present. Three active registrations; zero console errors. This frozen early build predates the final state panels.

| Interval | Observed time | Interpretation |
|---|---:|---|
| Navigation → resolved Auth | 3,387 ms | Includes entry download/startup, then Auth restoration |
| Auth lookup request | 714 ms | Subinterval of the preceding row |
| Firestore SDK chunk request → completion | 1,377 ms | 134,999 encoded wire bytes, gzip |
| SDK download completion → first registration | 20 ms | Combined parse/evaluation/initialization interval; parse is not isolated |
| Initial listen request → first response bytes | 628 ms | WebChannel handshake, not yet task data |
| Streaming request → first stream bytes | 586 ms | A later request in that same channel |
| First → last observed stream bytes | 4,365 ms | Includes arrival/pacing under the network profile |
| Last stream bytes → tasks snapshot event | 919 ms | SDK processing, scheduling and app decode combined; original decode was not separately instrumented |
| Tasks snapshot → store publication | 43 ms | Frame batching and remaining initial callbacks |
| Publication → two-frame data paint | 66 ms | Paint opportunity proxy, with rendered rows verified |
| Resolved Auth → store publication | 7,969 ms | Includes lazy download and initial data |
| Resolved Auth → data paint | 8,035 ms | Measurement only |
| Navigation → data paint | 11,422 ms | Includes Auth restoration |

Intervals overlap and must not be added together. Original CDP event clocks are aligned to browser epoch time; rounded values above are not independent precision claims. Observed startup encoded transfer was 1,149,993 B. Completed-response headers are included; unfinished-stream headers are omitted, so this is a wire-transfer lower bound. About **4.4 s of the 8.035 s** is the emulator's uncompressed **785,658 B** stream at the **180,000 B/s** Slow 4G profile. The emulator figure is not a Production prediction.

## Compression and decode follow-up

[Separate full-UI follow-up](startup-compression.json) preserves the original capture above. The Firestore emulator backchannel returned **no Content-Encoding**; JS returned gzip. Passive `Network.streamResourceContent` observation captured decoded payload bytes without interception or transport replacement. Raw document contents are not written into committed evidence.

- Captured WebChannel body: **784,047 B**; gzip at Node's default level 6: **23,115 B** (2.95%). Applying that ratio to the original 785,658 B suggests roughly **23,163 B**, or about **23 KB**. This is a **best-case lower bound** based on highly repetitive fixtures: `fake-data.ts` repeats nine base titles (with numeric suffixes), one description and empty categories.
- Reviewer-provided synthetic data of the same wire shape compressed to **5.2% with fake-data text versus 18.1% with varied text**. Those indicative results are distinct from the captured 2.95% ratio and are not a new measurement here. The realistic range is **UNVERIFIED**.
- This recompresses one captured buffer. Real streaming gzip can use different framing/flush behavior; production may compress, but production compression and transfer sizes are **UNVERIFIED**. Neither the best-case estimate nor the emulator latency predicts Production or the empty-account preview.
- Follow-up app callback processing: projects **1 ms**, tasks **41 ms**, activity **2 ms**. These include structural decoding, metadata handling and enqueueing, excluding SDK processing before the callback. SDK parse/evaluation is still not independently profiled.
- Follow-up resolved Auth → data publication **8,127 ms**, → data paint **8,231 ms**; observed transfer **1,148,394 B**. The follow-up includes e2e instrumentation, payload capture and final UI, so it does not replace the early step 6 result.

## Final review capture

[startup-final.json](startup-final.json) is the separate final full-UI review capture cited in REVIEW: resolved Auth → data publication **7,955 ms**, → data paint **8,035 ms**, observed encoded startup transfer **1,148,394 B**. It sits alongside the [early capture](startup-early.json) and [compression follow-up](startup-compression.json); identical paint totals do not make them the same run. It retains the same emulator/fixture limitations and is a measurement, not a Production target verdict.

The SDK's observed offline sequence is separately retained in `offline-*-390.json` and `offline-*-1280.json`: initial empty `fromCache:true` callbacks at about 94/29 ms after registration, application timeout at about 10,014/10,007 ms, then metadata-only server confirmations after restoration. No false first-run or replacement registrations occurred. These observations do not assume the SDK waits ten seconds before its first cache callback.
