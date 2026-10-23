# G2 local review — 2026-10-23

Local implementation and review checks pass. The Claude Code review at a7afb5d (relayed by the owner) is READY FOR ROLLOUT, and the unchanged rules were safe to deploy. **G2 is complete pending owner merge:** setup, the shared Firebase project, rules deployment, published-rules confirmation and preview behavior are VERIFIED by owner on 2026-10-23; the owner accepts the retained speed record for merge. Preview and Production share one Firebase project, so the rules deploy and any rollback affect both. Production verification stays **UNVERIFIED** until after merge. No agent deployment or merge.

## Changed

- Session data replaces product fixtures. The SDK-free facade dynamically loads Firestore/listeners after Auth; exactly three subscriptions use incremental document changes and one bounded frame queue. Projects/tasks require server confirmation; activity never blocks G2 views. Deadline, failed-stream retry, retained data, late timeout recovery and account isolation follow Q23/P5–P7.
- Structural timestamp decoding and effective-data equality preserve unchanged rows. Orphans are excluded from views/counts with `orphanCount`; empty projects show 0%, pre-load deep links show the skeleton, and unknown IDs get the approved minimal Dashboard link.
- Read-only states match `states.png`; Quick Add and empty-state actions retain G0's inert `aria-disabled` treatment. Navigation/Drawer parent rendering remains insulated from task updates.
- Explicit owner-only validating rules deny profile/unmatched paths. The shared emulator runner preserves its 90 s deadline, owns cleanup, records readiness/logs and uses Java 21+, Auth 9099 / Firestore 8081. Only approved rules-unit-testing 6.0.0 was added as a dev dependency; firebase stays exactly 13.0.0.

## Commands and evidence at a7afb5d

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
| `rg -n '__TASKLY_G2_SYNC_TEST__\|test-observer\|installTestObserver' dist` | Required no matches, expected exit 1; module and installer call must be absent from production |
| Source hard-rule searches | Only subscription module registers listeners; no one-shot/collection-group reads, persistent Firestore cache, product fixture import, loose `any`, console logs, TODOs or hard-coded colors outside tokens |
| Files / protected docs | Source files under 300 lines; AGENTS/PLAN and G0/G1 QA untouched. After review, owner authorized only firebase.json location nam5 → asia-southeast1; emulators block unchanged |

## Rollout-fix checks — 2026-10-23

- `npm run test -- tests/unit/firestore-measurement.test.ts tests/unit/bundle-graph.test.ts tests/unit/firebase-config.test.ts tests/unit/subscriptions.test.ts`: **21/21**. The actual adapter script succeeds in an isolated current-source checkout with no `test-results/gate-2` or dist, validates its in-memory graphs, rejects the eager control, and leaves no dist/saved graph. All four Firebase configuration tests pass, including unchanged Auth 9099 / Firestore 8081.
- `npm run lint` and `npm run typecheck`: pass. Full `npm run test`: **196/196 in 23 files**, 17.97 s, including the new real production-build assertion that observer module/marker/installer are absent. The initial lint finding in the new fixture's cleanup guard was corrected before these passing checks.
- Exit order `npm run measure:firestore-adapter`, then `npm run build`, then `npm run measure:bundle -- --record-evidence`: pass. Frozen adapter deferred sizes remain **134,622 / 138,163 B**. Current initial/deferred/total gzip: **127,820 / 137,162 / 264,982 B** (initial headroom 72,180 B).
- `rg -n '__TASKLY_G2_SYNC_TEST__\|test-observer\|installTestObserver' dist`: no matches, expected exit **1**. No public bundle graph; build-time boundary still rejects static/preloaded Firestore. No budget, listener or shared emulator deadline change.
- `firebase.json` comparison against `a7afb5d`: only `firestore.location` changed to the owner's verified `asia-southeast1`; every other property and the emulators block are identical. Rules and dependency files are unchanged. No deploy, rollback, published-rules check or live preview verification was performed by the agent; the owner's subsequent deployment, console and preview results are recorded in ROLLOUT and DECISIONS.
- Initial `npm run e2e`: **30/31**, with speed p95 **104.8 / 81.8 / 72.6 ms**. Run 1 failed the unchanged 100 ms limit. Zero navigation requests, three registrations unchanged; no sample exclusion or cause claimed. [All 180 samples and slow routes](rollout-fixes-speed/README.md) are preserved; one bounded verification rerun was announced.
- Bounded `npm run e2e` verification: **31/31** (3.3 min), speed p95 **68.6 / 74.7 / 68.2 ms**, zero navigation requests and three registrations unchanged. Each run had one Dashboard → My Tasks transition over 100 ms (**118.1 / 100.2 / 105.6 ms**). All 180 verification samples and the failed initial run remain recorded. Likely main-thread jitter; cause **UNPROVEN**, with the evidence detailed below. Committed startup captures were not regenerated. `git diff --check` passes; DECISIONS remains **300 lines** without a split.

The build graph is private under `test-results/gate-2`, hash-checked against the actual dist. `measure:bundle` rejects missing/stale graphs. The adapter measurement independently validates each in-memory build's graph, including the eager rejection control, and needs no prior dist or test-results directory. Production must contain no observer module/global/installer call. Optional existing Lighthouse script was skipped because it writes committed G0 evidence; Lighthouse/LCP/INP are not G2 pass conditions.

## Navigation and startup

All speed runs use 1,000 seeded tasks, 4× CPU, tracing off, 60 trusted clicks and two animation frames. Requests are attributed in each click-to-paint window; existing in-flight transport and outside-window requests are retained separately. There is no blanket Firestore filter.

| Run | Acceptance median / p95 / max ms | Review median / p95 / max ms | Review >100 ms | Requests / registrations |
|---|---|---|---:|---|
| 1 | 49.40 / 59.80 / 95.00 | 45.50 / 54.90 / 88.50 | 0 | 0 / 3 unchanged |
| 2 | 47.80 / 59.70 / 89.10 | 45.75 / 55.10 / 90.60 | 0 | 0 / 3 unchanged |
| 3 | 49.45 / 64.80 / 106.20 | 45.85 / 57.40 / 97.30 | 0 | 0 / 3 unchanged |

Acceptance run 3's one >100 ms transition was Dashboard `/` → My Tasks `/tasks` (106.20 ms). The three retained review JSON files contain all 180 final samples and zero slow route pairs, plus every request window and listener state. No samples were excluded from percentile calculations. Earlier browser-run console summaries are retained with emulator diagnostics; canonical speed files contain the review repeat.

Additional reviewer-reported runs each had one Dashboard `/` → My Tasks `/tasks` transition over 100 ms: **108.6 / 108.2 / 121.6 ms**, with p95 passing. A reviewer cold emulator run reached readiness at **64.3 s**, first output **23.2 s**. These are carried review observations, not new local measurements. The shared **90 s** deadline and all speed thresholds are unchanged.

The failed `initial-1` run had four samples over 100 ms (zero-based indices): **#0** `/` → `/tasks` **151.4 ms** (first visit); **#1** `/tasks` → `/projects/project-1` **108.0 ms** (first visit); **#10** **104.8 ms** and **#13** **166.2 ms** on that same project-route pair as **repeat visits**, new versus earlier G2 runs. With 60 samples, p95 is the **fourth-largest** sample. No request started in any click-to-paint window; only the pre-existing listen backchannel was in flight; registrations stayed **3 → 3**; console errors were **0**. The rollout fixes do not touch the navigation path: `subscriptions/index.ts` runs once per session start, and e2e behavior is unchanged. Likely main-thread jitter; cause **UNPROVEN**.

Combined retained G2 evidence, including reviewer-supplied runs: **18 runs, 17 passed and 1 failed (104.8 ms)**. The reviewer's runs at `f92fb4b` had p95 **73.1 / 61.4 / 66.8 ms**, with **zero samples over 100 ms**. The owner accepts the record for merge as meeting the strict **p95 < 100 ms** target, with the failed run retained and the cause unproven. **Carry to G3:** thin margin on `/tasks` and project-route transitions, including repeat visits to the project route. [Full failure record](rollout-fixes-speed/README.md); the owner's exact acceptance statement is in DECISIONS. No code, thresholds or samples were changed, and no test or measurement was rerun for this documentation correction.

Early step 6 resolved-sign-in → first data paint: **8.035 s**, measured rather than passed/failed. Breakdown and the separate gzip estimate are in [STARTUP-MEASUREMENT.md](STARTUP-MEASUREMENT.md) and DECISIONS. Final review full-UI follow-up: **7,955 ms** to publication / **8,035 ms** to paint, observed encoded startup transfer **1,148,394 B**. These are instrumented emulator observations, not preview/Production measurements. No speculative Firestore preload or loading-contract change was added. The empty-account preview cannot test the populated case.

About **4.4 s** of the early **8.035 s** is the uncompressed **785,658 B** emulator stream at **180,000 B/s**. The **23 KB** gzip estimate is a **best-case lower bound**: fixtures repeat nine base titles, one description and empty categories (captured ratio **2.95%**). The reviewer synthetic of the same wire shape gave **5.2%** for fake-data text versus **18.1%** for varied text. These indicative ratios do not establish Production transfer; the realistic range is **UNVERIFIED**. No new startup measurement was required for these corrections.

## Layout, metadata and failures retained

Populated Dashboard/tasks/projects, first-run, loading, empty project and load-error screenshots at 390/1280 px were checked. Exact copy, keyboard reachability, focus outline/return, dialog wrapping, 44 px controls, reduced motion, virtualization and no horizontal scroll pass. State-panel screenshots were visually compared with the four approved frames in `states.png`; no G4/G5 state panel was added.

Real SDK offline tests observed empty cache callbacks shortly after registration, an application timeout near 10 s, and zero-change server-confirmation callbacks on restoration. No false first-run occurred; automatic timeout recovery kept three registrations. Terminal callback retry replaced failed streams only and retained loaded data. [Raw observations](offline-after-restoration-390.json) complement unit tests for a non-empty cache, tasks-before-projects, hidden frames, transient document churn, bursts of 100 callbacks and stable rows.

Failures were not discarded: initial rules 84/85 exposed regex whitespace differences and expanded to 116 passing cases. First browser run passed 28/31; its retry assertions mistook registration for confirmation, and refresh polling read the observer before its lazy installation. Corrected waits passed both widths and the full acceptance/review suites. Cold CLI startup failures, the reserved readiness-name bug and later successful readiness are documented in [EMULATOR-STARTUP.md](EMULATOR-STARTUP.md); no 90 s increase or proven historical G1 root cause is claimed. Complete normalized logs/config/traces are archived under [emulator-logs](emulator-logs/README.md).

## Not done and owner handoff

No G3 product writes/CRUD, activity UI, minute tick, offline persistence, live seeding, profile access, automatic audit fix, agent rules deployment, PR or merge. No PLAN or AGENTS edits. Rollback has not been performed; Production remains **UNVERIFIED** until after merge.

The owner verified database/location, Vercel environment checks, unset flags, authorized alias and the shared Firebase project on 2026-10-23: the rules deploy and any rollback affect both Preview and Production. The owner deployed rules from `f92fb4b` to `taskly-v2`, confirmed console publication at Oct 23, 3:54pm with matching text, and verified the preview in a fresh Chrome 155.0.8059.85 (Official Build) (64-bit) (cohort: Stable) profile on Windows 11: Google sign-in, first-run, no load error after 15 s or on Dashboard/My Tasks, 0 console errors, persisted session on reload and return to sign-in on sign-out. These are **VERIFIED by owner**, not independently checked by the agent. [ROLLOUT.md](ROLLOUT.md) and DECISIONS record the details; **Production stays UNVERIFIED until after merge**.

The [five proposed PLAN wordings](PROPOSED-PLAN-CHANGES.md) remain proposals: initial JS definition, G2 rules rollout, explicit validation matches, timestamp storage, effective-data equality. P1's pending-serverTimestamp carry-over remains for G3. The owner will decide after G2 whether a populated first-data target or mitigation is warranted.
