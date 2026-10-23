# G2 local review — 2026-10-23

Local implementation and review checks pass. **G2 remains incomplete:** owner setup, rules deployment and deployed-preview verification are UNVERIFIED. Stop at the owner rollout handoff; no agent deployment or merge.

## Changed

- Session data replaces product fixtures. The SDK-free facade dynamically loads Firestore/listeners after Auth; exactly three subscriptions use incremental document changes and one bounded frame queue. Projects/tasks require server confirmation; activity never blocks G2 views. Deadline, failed-stream retry, retained data, late timeout recovery and account isolation follow Q23/P5–P7.
- Structural timestamp decoding and effective-data equality preserve unchanged rows. Orphans are excluded from views/counts with `orphanCount`; empty projects show 0%, pre-load deep links show the skeleton, and unknown IDs get the approved minimal Dashboard link.
- Read-only states match `states.png`; Quick Add and empty-state actions retain G0's inert `aria-disabled` treatment. Navigation/Drawer parent rendering remains insulated from task updates.
- Explicit owner-only validating rules deny profile/unmatched paths. The shared emulator runner preserves its 90 s deadline, owns cleanup, records readiness/logs and uses Java 21+, Auth 9099 / Firestore 8081. Only approved rules-unit-testing 6.0.0 was added as a dev dependency; firebase stays exactly 13.0.0.

## Commands and evidence

| Check | Result |
|---|---|
| Initial continuation precheck: full `npm run test` | 125 tests / 14 files passed |
| Evidence isolation check around `measure:bundle -- --record-evidence` | Only G2 bundle evidence changed; 14 G0 / 32 G1 files unchanged |
| `java -version` | Temurin 21.0.12.1; CLI 15.34.0 |
| `npm run build` | Pass; no public bundle graph |
| `npm run lint`, `npm run typecheck` | Pass, including review repeat |
| `npm run test` | 195 tests / 22 files passed; review repeat 15.06 s |
| `npm run test:rules` | 116 tests / 2 files passed, 15.31 s; signed-out/other-user denial, owner queries/writes, exact field contract and whitespace parity |
| `npm run e2e -- --record-evidence` | Acceptance 31/31 (3.3 min); review repeat 31/31 (3.1 min) |
| `npm run measure:bundle -- --record-evidence` | 127,835 B initial + 137,163 B deferred = 264,998 B total gzip; initial headroom 72,165 B |
| `npm run measure:firestore-adapter` | Frozen matched read deferred 134,622 B / extended 138,163 B unchanged; eager control rejected |
| `npm audit --omit=dev --json` | Exit 1: four high package entries; affected Node grpc-js absent from all browser chunks; see dependency assessment |
| `rg -i "grpc" dist` | Matches status/configuration strings in deferred Firestore; no @grpc/proto-loader/protobufjs/Firestore-node modules in actual build graph |
| `rg -n '__TASKLY_G2_SYNC_TEST__\|test-observer' dist` | No matches, expected exit 1; module absent from production graph |
| Source hard-rule searches | Only subscription module registers listeners; no one-shot/collection-group reads, persistent Firestore cache, product fixture import, loose `any`, console logs, TODOs or hard-coded colors outside tokens |
| Files / protected docs | Source files under 300 lines; AGENTS, PLAN and firebase.json unchanged; G0/G1 QA untouched |

The build graph is private under `test-results/gate-2`, hash-checked against the actual dist. Automated tests reject missing/stale graphs and a Firestore runtime reachable through entry static imports or HTML modulepreloads. Production contains no e2e observer module/global. Optional existing Lighthouse script was skipped because it writes committed G0 evidence; Lighthouse/LCP/INP are not G2 pass conditions.

## Navigation and startup

All speed runs use 1,000 seeded tasks, 4× CPU, tracing off, 60 trusted clicks and two animation frames. Requests are attributed in each click-to-paint window; existing in-flight transport and outside-window requests are retained separately. There is no blanket Firestore filter.

| Run | Acceptance median / p95 / max ms | Review median / p95 / max ms | Review >100 ms | Requests / registrations |
|---|---|---|---:|---|
| 1 | 49.40 / 59.80 / 95.00 | 45.50 / 54.90 / 88.50 | 0 | 0 / 3 unchanged |
| 2 | 47.80 / 59.70 / 89.10 | 45.75 / 55.10 / 90.60 | 0 | 0 / 3 unchanged |
| 3 | 49.45 / 64.80 / 106.20 | 45.85 / 57.40 / 97.30 | 0 | 0 / 3 unchanged |

Acceptance run 3's one >100 ms transition was Dashboard `/` → My Tasks `/tasks` (106.20 ms). The three retained review JSON files contain all 180 final samples and zero slow route pairs, plus every request window and listener state. No samples were excluded from percentile calculations. Earlier browser-run console summaries are retained with emulator diagnostics; canonical speed files contain the review repeat.

Early step 6 resolved-sign-in → first data paint: **8.035 s**, measured rather than passed/failed. Breakdown and the separate gzip estimate are in [STARTUP-MEASUREMENT.md](STARTUP-MEASUREMENT.md) and DECISIONS. Final review full-UI follow-up: **7,955 ms** to publication / **8,035 ms** to paint, observed encoded startup transfer **1,148,394 B**. These are instrumented emulator observations, not preview/Production measurements. No speculative Firestore preload or loading-contract change was added. The empty-account preview cannot test the populated case.

## Layout, metadata and failures retained

Populated Dashboard/tasks/projects, first-run, loading, empty project and load-error screenshots at 390/1280 px were checked. Exact copy, keyboard reachability, focus outline/return, dialog wrapping, 44 px controls, reduced motion, virtualization and no horizontal scroll pass. State-panel screenshots were visually compared with the four approved frames in `states.png`; no G4/G5 state panel was added.

Real SDK offline tests observed empty cache callbacks shortly after registration, an application timeout near 10 s, and zero-change server-confirmation callbacks on restoration. No false first-run occurred; automatic timeout recovery kept three registrations. Terminal callback retry replaced failed streams only and retained loaded data. [Raw observations](offline-after-restoration-390.json) complement unit tests for a non-empty cache, tasks-before-projects, hidden frames, transient document churn, bursts of 100 callbacks and stable rows.

Failures were not discarded: initial rules 84/85 exposed regex whitespace differences and expanded to 116 passing cases. First browser run passed 28/31; its retry assertions mistook registration for confirmation, and refresh polling read the observer before its lazy installation. Corrected waits passed both widths and the full acceptance/review suites. Cold CLI startup failures, the reserved readiness-name bug and later successful readiness are documented in [EMULATOR-STARTUP.md](EMULATOR-STARTUP.md); no 90 s increase or proven historical G1 root cause is claimed. Complete normalized logs/config/traces are archived under [emulator-logs](emulator-logs/README.md).

## Not done and owner handoff

No G3 product writes/CRUD, activity UI, minute tick, offline persistence, live seeding, profile access, automatic audit fix, rules deployment, PR or merge. No PLAN or AGENTS edits.

Follow [ROLLOUT.md](ROLLOUT.md): confirm project/database/location, exact authorized preview host and unset emulator flags; review and deploy rules as owner before merge; report real-Google empty-account first-run and console results; check Production after merge. The expected preview alias redirects to Vercel access protection, so the app and live rules remain unverified.

The [five proposed PLAN wordings](PROPOSED-PLAN-CHANGES.md) remain proposals: initial JS definition, G2 rules rollout, explicit validation matches, timestamp storage, effective-data equality. P1's pending-serverTimestamp carry-over remains for G3. The owner will decide after G2 whether a populated first-data target or mitigation is warranted.
