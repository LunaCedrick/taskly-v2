# Rollout-fix navigation verification — 2026-10-23

The first full browser run passed 30/31 tests and failed the unchanged `p95 < 100 ms` check in speed run 1. All three sets of 60 samples are retained in `initial-1.json` through `initial-3.json`. No samples were removed or thresholds changed. The evidence below supports likely main-thread jitter; the cause remains **UNPROVEN**.

| Initial run | Median / p95 / max ms | >100 ms transitions | Navigation requests / registrations |
|---|---|---|---|
| 1 | 56.35 / 104.80 / 166.20 | `/` → `/tasks`: 151.4; `/tasks` → `/projects/project-1`: 108.0, 104.8, 166.2 | 0 / 3 unchanged |
| 2 | 59.10 / 81.80 / 117.90 | `/` → `/tasks`: 117.9, 115.8 | 0 / 3 unchanged |
| 3 | 52.95 / 72.60 / 118.80 | `/` → `/tasks`: 118.8 | 0 / 3 unchanged |

`initial-1` contains four samples over 100 ms (zero-based indices):

| Sample | Transition | Time | Visit |
|---|---|---:|---|
| #0 | `/` → `/tasks` | 151.4 ms | First visit |
| #1 | `/tasks` → `/projects/project-1` | 108.0 ms | First visit |
| #10 | `/tasks` → `/projects/project-1` | 104.8 ms | Repeat visit |
| #13 | `/tasks` → `/projects/project-1` | 166.2 ms | Repeat visit |

With 60 samples, the recorded nearest-rank p95 is the **fourth-largest** sample: 104.8 ms. The two repeat project-route stalls are new versus earlier G2 runs; first-visit cost alone does not explain this failure. No request started in any click-to-paint window; only the pre-existing listen backchannel was in flight. Registrations stayed **3 → 3**, and console errors were **0**. The rollout fixes do not touch the navigation path: `subscriptions/index.ts` runs once per session start, and its e2e behavior is unchanged. Likely main-thread jitter; cause **UNPROVEN**.

One bounded full-browser verification rerun was announced. It uses the same code, data count, three-listener contract, CPU throttle, tracing setting, trusted-click measurement and thresholds. Existing canonical `speed-1.json` through `speed-3.json` above this directory remain the earlier a7afb5d review evidence; these follow-up records do not overwrite them. The routine startup capture stays ignored and does not replace the three committed startup captures.

The verification passed **31/31 browser tests** (3.3 min). `verification-1.json` through `verification-3.json` retain all 180 additional samples and request/listener windows:

| Verification run | Median / p95 / max ms | >100 ms transitions | Navigation requests / registrations |
|---|---|---|---|
| 1 | 53.25 / 68.60 / 118.10 | `/` → `/tasks`: 118.1 | 0 / 3 unchanged |
| 2 | 55.40 / 74.70 / 100.20 | `/` → `/tasks`: 100.2 | 0 / 3 unchanged |
| 3 | 54.05 / 68.20 / 105.60 | `/` → `/tasks`: 105.6 | 0 / 3 unchanged |

A passing verification does not prove a cause for the initial failure. Both complete run sets remain visible; no further agent rerun or threshold adjustment was made. `commands.json.gz` holds normalized outer command output and the two owned emulator runs' config/startup/debug logs; decode as gzip-compressed JSON using Node's `zlib.gunzipSync`, then `JSON.parse`. Original ignored diagnostics are retained too.

## Combined retained G2 record and G3 risk

Including the reviewer-supplied runs, **18 G2 runs have retained samples: 17 passed and 1 failed** (104.8 ms). The reviewer's runs at `f92fb4b` had p95 **73.1 / 61.4 / 66.8 ms**, with **zero samples over 100 ms**. These are relayed reviewer results, not new agent measurements; no samples were regenerated in this documentation update.

The owner accepts the speed record for merge: it meets the strict **p95 < 100 ms** target with the failed run retained and the cause unproven. **Carry to G3:** thin margin on `/tasks` and project-route transitions, including repeat visits to the project route. Keep the same threshold and preserve the regression evidence. The owner's exact acceptance statement is recorded in [DECISIONS](../../../DECISIONS.md#g2-owner-decisions-2026-10-22).
