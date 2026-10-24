# G3 checkpoint 1

Status: checkpoint-1 CHANGES NEEDED review revision; step 5 remains stopped.
Owner authorized implementation through steps 3–4 only on 2026-10-24.
Baseline app revision: `d16fe58` (main); owner answers first committed as `213f134`.
Implementation committed and pushed as `3b6c6df`; evidence measured that working source.

## Scope

Lazy mutation transport and pending timestamp handling; real SDK queue/sign-out/reconnect
experiments before guards. No CRUD interface, guard, rules edit/deploy, dependency install,
Production measurement, or later-gate feature is authorized by this checkpoint.

## Baseline and carried evidence

- [baseline-bundle.json](baseline-bundle.json) and [baseline-production-graph.json](baseline-production-graph.json)
  are from the unchanged app with G3 artifact routing, before mutation integration.
- G2 final baseline: initial 127,820 / deferred 137,162 / total 264,982 B gzip.
  Fresh baseline with local `.env` Firebase config inlined: 127,820 / 137,170 / 264,990 B;
  deltas 0 / +8 / +8 B. The carried G2 record is not a matched config-free rebuild.
  Initial graph contains no Firestore runtime. Only initial has a byte cap: strictly <200,000 B.
- Historical G2 evidence mismatch: `docs/qa/gate-2/bundle.json` lists the final four chunks,
  including entry `index-BEzxPrzy.js`; `production-bundle-graph.json` instead describes a
  single entry `index-bUZJVBSx.js` with no import/dynamic edges. These are different assets;
  their cause is unproven. G2 evidence stays unchanged. Fresh G3 graph hashes are validated
  against the emitted JS and HTML before measurement.
- G2 retained 18 speed runs: 17 passed, one p95 104.8 ms failure. Thin margins include
  `/tasks` and repeat project visits; cause remains unproven. Retain all G3 runs, per-pair
  counts and every transition >100 ms; never rerun unchanged code until it passes.
- Production populated first-data latency remains unverified. Q10 says: “Defer populated
  Production first-data measurement until genuine G3 data exists. I will decide after G3
  merges.” These are separate conditions/statements. G2's 8,035 ms is measurement-only.

## Accepted limits and deferred behavior

- Q09: task-first/project-last deletion, explicit retry of remaining tasks. Partial failures
  preserve acknowledged deletes. A dismissed overlay does not stop an in-flight cascade.
  Navigate to Dashboard after completion only if still on the deleted project's route.
  The owner accepts the narrow cross-device orphan race and does not require cross-device
  exactly-once cascade summaries. One client operation and its retries reuse event identity.
- P2: no activity for ordinary task edits; no `task.updated`. Types remain strings in reader
  and rules. Approved event texts are compared to `dashboard.png` at this checkpoint.
- P5: no unload/sign-out guards before owner reviews actual SDK experiment results.
- P6: later task entry points require healthy, confirmed projects AND tasks; destructive
  confirmations wait for relevant pending task writes and recompute their counts.
- The frozen G2 adapter probe and its regression test are intentionally excluded from G3's
  default checks. No G0–G2 evidence is regenerated. Browser runs use unique G3 directories.

## Proposed documentation changes (not applied)

- AGENTS: add the existing no-COOP rule; Google popup sign-in breaks with that header.
- PLAN: for G3, task row mutations are live only on Project view, overriding “from any
  screen”; global Quick Add, topbar add, and project creation remain available (owner P1).
- PLAN G3 rollout addition: proposed wording from the approved G3 skill (not owner wording):
  “In G3, after review and before
  merge, the owner deploys reviewed owner-only Firestore rules if changed and verifies the
  approved G3 write flows on the Vercel preview with real Google sign-in. The preview and
  manual second-device checks block marking G3 complete. The owner verifies Production
  after merge. These checks remain UNVERIFIED until the owner reports them. The agent
  never deploys rules. G6 retains final deployment verification.”
- CONTEXT §8: make the adapter measurement command G2-specific; G3 uses its approved
  exit commands and its actual normal production graph. No new later-gate metrics.

## Implemented and verified so far

- SDK-free `src/lib/mutations` facade is installed at signed-in session bootstrap, with
  generation/current-session checks before dispatch and on async results. Disposing it
  does not claim to cancel SDK writes. No submission-time import or route-time network.
- Lazy `firebase/writes.ts` reuses the memoized database and encodes timestamps/batches.
  It is low-level transport; entity planning, store coordination, and interfaces are later.
- Listeners request `serverTimestamps: 'estimate'` before structural decoding. Required
  confirmed null timestamps still fail; the reader still accepts arbitrary activity strings.
- Production graph, local `.env` Firebase config inlined (not a config-free comparison):
  127,922 / 141,229 / 269,151 B gzip; G2 deltas +102 / +4,067 / +4,169 B.
  Initial headroom 72,078 B. No runtime Firestore static/preload reachability; both test
  control modules and markers are absent. [Bundle](checkpoint-1-bundle.json),
  [hash-matched graph](checkpoint-1-production-graph.json).
- Controlled config-free rebuild in this review: empty envDir and all `VITE_*` removed
  in the child process, mode production. Main 127,712 / 137,164 / 264,876 B; branch
  127,804 / 141,228 / 269,032 B; deltas +92 / +4,064 / +4,156 B. Both initial graphs
  exclude Firestore. [Matched measurements](bundle-no-env-Du9USx/measurements.json).
  This independently reproduces the reviewer's initial-byte comparison. No `.env` was
  edited, renamed, printed or used by those builds. Earlier local-config results remain.
- Node 24.16.0, TypeScript 6.0.3, Vite 8.3.4, Firebase 13.0.0, Temurin Java 21.0.12.1.
  No install, dependency/lockfile change, Firebase pin change, or emulator deadline change.
- Build, lint and typecheck pass. Unit checks: 199/199 in 24 files, 77.51 s.
  Initial parallel execution had three worker-start timeouts (cause not isolated);
  verification uses one worker. Its first run found a missing unsubscribe in the new test's mock
  (198 passed / 1 failed); corrected run passes. Both results are retained.
  The initial lint scan was stopped; generated artifact trees are now excluded and final
  lint passes. Unit workers now run serially; no test or emulator deadline was extended.
- Audit exits 1: the same four high findings in the Node `@grpc/grpc-js` dependency chain.
  No grpc module occurs in the actual browser module graph. The dist text search matches
  protocol/status strings in the deferred SDK; that is not evidence of Node grpc reachability.
  No automatic fix or downgrade. [Audit](dependency-audit.json).

## Real SDK experiments (before guards)

All three tests passed in `emulator-zRVuYK` (CLI module tracing enabled for diagnosis).
Evidence: [pending timestamps](emulator-zRVuYK/pending-timestamps.json),
[sign-out/reconnect](emulator-zRVuYK/q11-sign-out-reconnect.json),
[tab close](emulator-zRVuYK/q11-tab-close.json).

- Pending project/task/activity creation and task completion: default raw timestamps are
  null; estimates are numeric. The task appears via listener → store with 1,000 seeded
  tasks. All acknowledgements reconcile without killing a stream or replacing its handle.
- A 22-event wave reconciles latest-20 membership locally and after acknowledgement.
  A batch containing a valid task edit and an immutable-activity-timestamp violation is
  rejected atomically: optimistic task title rolls back, with three healthy registrations
  and no decode errors. No required activity is silently dropped to save the task.
- Offline queued write → sign-out: store clears, handles drop to zero; the write commit
  stays pending. `waitForPendingWrites` rejects with `cancelled` because the user changed.
  This is NOT cancellation of the underlying write.
- Earlier test used a DIFFERENT ORDER from planned experiment 5: reconnect while anonymous
  BEFORE B signs in online. That sequence (1,500 ms observation) leaves the old operation pending and
  absent on the server. Another account writes successfully with no old-user rows in
  its store. Returning to the original account acknowledges the old write and creates
  its original-path server document. The facade marks that old result currentSession=false.
- Closing the offline tab loses the memory-only task and its activity. A new tab restores
  Auth and server data but neither pending document exists in the store or on the server.
- These are measured SDK 13.0.0 emulator outcomes, not a promise that all network/in-flight
  races behave identically. Guards remain unimplemented pending owner review (P5).
- [Activity contract and visual comparison](ACTIVITY-CONTRACT.md): Q16 keeps “Completed
  {task}”. The “You completed” frame is a known design deviation for G4; unchanged in G3.

## Retained startup failure

- `emulator-iTDnYl`: first output 66,894 ms; both service probes remained ECONNREFUSED
  through 90,000 ms. No browser test ran. [Normalized evidence](emulator-logs/emulator-iTDnYl/startup.json).
- Separate traced diagnostic `emulator-zRVuYK`: first output 2,284 ms; Auth 68,300 ms,
  Firestore 58,852 ms. Main module load 44,828 ms, controller 42,245 ms including
  Pub/Sub 28,420 ms. Inclusive intervals overlap. This localizes CLI bootstrap delay;
  underlying cause remains unproven. Later warmed success does not erase the cold failure.

## Prior checkpoint checks (at a05cffc; retained)

| Check | Result |
|---|---|
| java -version | Temurin 21.0.12.1; checked before emulator runs |
| npm run build | PASS; normal production graph measured |
| npm run lint | PASS; generated artifacts ignored |
| npm run typecheck | PASS; strict app and test types |
| npm run test | PASS; 199 tests / 24 files, 77.51 s (corrected run) |
| npm run test:rules | PASS; 116 tests / 2 files, 23.49 s; rules unchanged |
| npm run e2e -- --record-evidence | PASS; 34 tests, 4.6 min; retries 0 |
| npm run measure:bundle | PASS; sizes and graph above |
| npm audit --omit=dev | Exit 1; four carried high findings, browser reachability above |

Full browser regression evidence: [emulator-Vltibv](emulator-Vltibv/).
Its three SDK experiments also pass, independently of the earlier traced diagnostic.
Existing shell/auth/data/sync checks pass at 390/1280 px. These screenshots are existing
views; they are not evidence of a new G3 interface. [Navigation measurements](SPEED-CHECKPOINT-1.md)
retain 180/180 samples, all nine transitions >100 ms, and request windows. p95 values
97.8 / 93.6 / 94.9 ms satisfy the numeric `<100 ms` rule but lack Q15's same-session
passing main baseline and do not establish qualified acceptance. The 2.2 ms smallest margin
and repeat-project slow sample are carried risks; G2's underlying cause remains unproven.
[All actual emulator starts, including failure](emulator-logs/README.md).

## Checkpoint-1 review revision (2026-10-25)

Q15/Q16 are appended verbatim in `docs/decisions/g3.md`, after the unchanged P1–P9
and original owner block. No other new statement is attributed to the owner.
This revision edits only G3 docs/evidence and tests. App source, rules, dependencies,
AGENTS, PLAN, CONTEXT and the approved skill remain unchanged. Step 5 is not started.

| Review item | Ran / changed | Only read or not run |
|---|---|---|
| 1 Speed | Predeclared 6 A/B pairs, 6 C runs; 1,080 samples; 120- and 600-click profiles; 3 analysis unit tests | Skill §13, both speed specs, build/subscription integration; reviewer numbers are reported, not remeasured historic runs |
| 2 Experiment 5 | All 3 unsynced-write browser tests pass (16.7 s), including the corrected order below | Existing probe/Auth and ownership rules inspected; no guard, rule edit or rules-suite rerun |
| 3 Bundle environment | Matched no-env production builds on main and branch, linked above | Firebase config inlining source read; local `.env` values not read/printed/changed |
| 4 Q10 | Corrected prose to quote both statements separately | Owner Q10 read; no populated Production latency measurement |
| 5 Rollout attribution | Labeled quote as proposed wording from approved skill | Skill Report wording read; no PLAN edit or owner rollout action |
| 6 Fixed baseline output | Main A1–A6 copied immediately into separate directories; freshness checked | Main QA path read; original repository's G2 evidence untouched |

Reviewer-reported aggregates and all new raw samples are indexed in
[SPEED-CHECKPOINT-1.md](SPEED-CHECKPOINT-1.md). Pooled diagnostics: main 9.17% >100 ms,
p95/p99 107.6/155.4 ms; branch 9.72%, 106.2/155.6 ms; eight slow repeat task→project
transitions each. Strong session drift and C's later order limit causal conclusions.
The extended profile captures a 118.9 ms repeat transition with a 75 ms long task;
no GC in that window. Findings/proposals are reported, with no app optimization applied.
These diagnostics replace no acceptance runs and claim no Q15 acceptance pass/fail.

### Corrected experiment 5

[Evidence](emulator-coxPzs/q11-offline-account-switch.json): A queued offline → sign out
→ sign in B STILL OFFLINE → reconnect as B → observe → return to A. Earlier evidence
reconnected anonymously before B signed in online; it was a different order and remains.
“Offline” here means Firestore SDK `disableNetwork`, not browser/context offline.
`navigator.onLine` remained true. Auth was reachable: the popup handler, signInWithIdp,
and account lookup requests were captured while Firestore remained disabled.

B's initial streams were fromCache/uncorroborated, with no A project in B's store.
After `enableNetwork` and a bounded 1,500 ms observation, A's commit was still pending,
its server document absent, and B's confirmed store empty. No permission-denied outcome
was observed; this is NOT evidence of a rules rejection or write cancellation.
Returning to A acknowledged the write and created A's server document; the stale
facade result was marked currentSession=false. waitForPendingWrites had rejected with
cancelled on the user change. Exactly three active listeners per signed-in session.
Server presence checks use a separate Node emulator fixture with rules disabled for
observation; they do not reconnect the browser's Firestore or exercise a live project.
Only expected aborted Listen requests were recorded; no page/console errors.

Current checks: typecheck and lint pass; three diagnostic-analysis tests pass; the three
unsynced-write browser tests pass; both bounded profile tests pass. The earlier profiling
trace declaration failed typecheck once and was corrected before measurement. The first
review emulator startup failed at 90 s before samples; it is retained. Prior 199-unit/
116-rules/full-e2e results above are historical, not rerun claims for this docs/test revision.

## Stopped work and next approval

No entity planning/store coordination, CRUD UI, Q05 fixture/helper changes, departure
guard, rule diff/edit/deployment, real Google preview, manual second-device timing,
Quick Add timing, or populated Production measurement is implemented/claimed here.
The gate-end review and G3 completion remain later work.

Owner review of checkpoint 1 is required before step 5/guards or further integration.
The later checkpoint 2 remains a second stop: pushed branch, integrated CRUD interface,
stable branch alias host reported for owner Auth authorization, then a proposed rules
diff BEFORE any edit to firestore.rules. Owner rollout rows (a)–(f) remain UNVERIFIED
until reported, and rules are deployed only by the owner. The existing owner-reported
empty real database and Q10 deferral remain in force. AGENTS/PLAN/CONTEXT proposals
above have not been applied, and G0–G2 evidence has not been rewritten.
