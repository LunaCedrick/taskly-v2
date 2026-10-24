# Checkpoint 1 actual emulator starts

Shared spawn-to-usable-Auth-and-Firestore deadline: 90,000 ms, unchanged. Java 21.0.12.1,
CLI 15.34.0, Node 24.16.0; demo-taskly-auth, Auth 9099 / Firestore 8081. No unrelated
service was reused/stopped, no CLI patched/prewarmed, no dependency installed.

Review follow-up starts (2026-10-25; same 90 s deadline):

| Run | Result | First output ms | Auth ms | Firestore ms |
|---|---|---:|---:|---:|
| emulator-zzO7ap | [Failed before samples](../speed-review-RZFgI1/startup-failure.json) | 70,357 | — | — |
| emulator-hX9Xw6 | [Traced CLI diagnostic session](../speed-review-UrhkFS/startup.json); 18 speed diagnostics + first profile | 2,295 | 84,344 | 77,175 |
| emulator-coxPzs | [Corrected experiment 5 and two controls](../emulator-coxPzs/startup.json); 3 pass | 1,454 | 14,580 | 7,253 |
| emulator-oqllX1 | [Fixed 600-click profile](../profile-review-TQtYai/startup.json); 1 pass | 1,845 | 15,840 | 8,157 |

These are diagnostic starts, not new acceptance claims. Raw logs/CLI trace remain in
the corresponding ignored `test-results/gate-3/` folders; full startup probes are linked.

| Run | Purpose/result | First output ms | Auth ready ms | Firestore ready ms |
|---|---|---:|---:|---:|
| [emulator-iTDnYl](emulator-iTDnYl/startup.json) | First experiments; startup FAILED; no browser ran | 66,894 | — | — |
| [emulator-zRVuYK](emulator-zRVuYK/startup.json) | Separately labeled CLI trace diagnostic; 3 experiments pass | 2,284 | 68,300 | 58,852 |
| [emulator-RtJhyi](emulator-RtJhyi/startup.json) | Untraced rules; 116 pass | 2,078 | 21,281 | 10,856 |
| [emulator-Vltibv](emulator-Vltibv/startup.json) | Untraced full browser; 34 pass | 1,965 | 21,642 | 10,747 |

Every startup's full probe attempts/config are retained as compact normalized JSON
(array contents unchanged). The failed start's output is included. Full raw logs and
the diagnostic module-load JSONL remain in the corresponding `test-results/gate-3/`
directories; these ignored raw directories were not deleted or overwritten.

Main's unchanged speed spec writes fixed `test-results/gate-2/speed-*.json` paths.
Baseline comparisons MUST copy those files to separate G3 per-run directories immediately
after every run. The review diagnostic harness uses an isolated main checkout and preserves
each copy; it never overwrites the original repository's G2 evidence.

[Diagnostic summary](emulator-zRVuYK/module-trace-summary.json) records row count,
last trace entry and 25 longest inclusive loads. Main bootstrap took 44.828 s;
emulator controller 42.245 s, including 28.420 s in Pub/Sub dependencies. Inclusive
times overlap and must not be summed. Tracing overhead remains inside the deadline.
This identifies a delay phase, not its underlying filesystem/CPU cause. A later warmed
success does not erase the first failed cold start. Startup is not a Production latency
measurement. Simulated runner unit fixtures are separate from these actual SDK runs.
