# G3 checkpoint 2

## Review revision (2026-10-25)

Q18–Q20 in `docs/decisions/g3.md` are verbatim owner decisions. Work order is UI/tests
and full checks first; commit/push the exact rules-test plan second; only then apply
the approved rules diff and its tests together in a separate commit. No deployment.

| Review item | Change / validation |
|---|---|
| 2 Errors | Errors bypass the four-normal-toast cap and identical messages merge; every recovery draft survives merging. Normal overflow removes the oldest queued normal, preserving the visible message. Unit coverage added. |
| 3 Confirmations | Stronger destructive-submit selector uses `--overdue`; both dialogs have a tinted trash icon; counts use `1 task`. Browser computed-color/icon assertions added. |
| 4 Focus | Cancel returns to the trigger; only an actual task-delete operation selects Q12's fallback. Browser assertions cover cancel and deletion. |
| 5 Rejected UI save / sign-out | New emulator browser coverage injects a one-time immutable-createdAt change into a UI task update: real rules rejection, recover original edit, retry to server success. Another test keeps the unload guard active after SDK-offline sign-out, then reconnects/returns to the original user and waits for settlement. Auth/browser remain online. |
| 6 DST | `npm run test` now includes a separate New York forks project with a mandatory timezone assertion; no DST skip. |
| 7 Rollout | Row (d) requires a pinned owner-reviewed rules commit, a clean checkout and exact approved rules text. Real project is `taskly-v2`; commit ID is filled after step 3. All statuses remain UNVERIFIED. |
| 8 Unused guard | Removed `PendingUnloadGuard`; `main.tsx` remains the sole installer. |
| 9 Row actions | Q19 approves always-visible Edit/Delete as a deviation from SCREENS line 38's hover reveal. Code already did this; no hover implementation added. |
| 10 Provenance | `run-checkpoint2-monitor.mjs` and `analyze-speed.mjs` changed after the `fdb9a2f` monitor ran: derived sequence/visit annotations only, no timing samples changed. The full-e2e result at the final step-1 source head is recorded below when run. |
| 11 Loading | Q20 rejects the lazy-loading proposal in G3; no loading redesign. Existing Firestore boundary remains. |
| 12 Full suite | Pending execution at the committed final step-1 source head; no further app/test edits after that run without revalidation. |

Initial focused run: 12 tests passed but one worker-start timeout; its inherited
project configuration also merged include arrays. Explicit project configs now avoid
duplicate scheduling; corrected focused run: 3 files / 9 tests PASS, including DST,
10.48 s. Initial browser attempt `emulator-LxzrFy` failed at the unchanged shared
90 s startup deadline before assertions; retain it, do not relabel it a UI failure.
Current rules and rule-test files remain untouched during step 1.
The first full run at `b56f8c8` retained 39 e2e passes and three failures: both widths'
post-delete focus assertion and a five-second cascade poll. Deletion focus now waits
for listener publication and the replacement DOM; cancel still returns to its trigger.
Cascade completion uses the existing 15-second `waitForSync` condition, not a new
latency target. That failed full run and all its speed samples are retained separately.

The sections below retain the original report at `2a3d557`; current review results
and the subsequent approved rules application supersede their historical stop status.

## Original checkpoint 2 (retained)

Owner extended P9 through checkpoint 2 on 2026-10-25. STOP before editing
`firestore.rules`. G3 is not complete; no later steps, deployment or merge is claimed.
Q17 is appended verbatim after the existing blocks in `docs/decisions/g3.md`.
Initial integration/monitor source: `fdb9a2f`; final functional corrections: `2a71db0`.
Protocol committed/pushed BEFORE monitoring: `4181103`.

## Interface and write coordination

- Integrated project create/rename/delete, task add/edit/complete/status/project moves,
  native date/time fields, chips, project/priority selects, category suggestions,
  Quick Add/More options, project progress and confirmations/toasts. First-run,
  empty-project, sidebar/drawer, topbar and floating entry points are wired.
- Q13: live row mutations are restricted to Project views. Dashboard/My Tasks remain
  read-only rows. Global task/project entry points remain available. No G4/G5 UI added.
- Entity optimism still follows SDK cache → the three listeners → store. No second
  entity cache, extra product read, new listener or route-time SDK import was added.
- Pure planners implement Q02–Q09, preserve entered text, no string caps, session-only
  defaults/palette reuse, and the approved activity matrix without `task.updated`.
  Activity types stay strings in both the reader and current/proposed rules.
- Required activity and its entity change share one batch. Same-operation task retry
  retains IDs/operations in recoverable submitted drafts; changing a recovered draft
  is a new operation. Later Quick Add input is preserved after a rejected submission.
- Cascade: task batches ≤500 operations, then a final two-operation batch removes the
  project with one summary. Stop after a rejected batch; keep the project and already
  deleted tasks as-is. Explicit retry replans remaining in-memory tasks and reuses the
  summary ID. No blind retry, durable guard, new schema or false whole-cascade atomicity.
  Dismissal does not cancel work. Navigate to Dashboard only if still on that project.
- Relevant pending task writes disable destructive confirmation; count is recomputed
  after they settle. The facade retains old-user pending task identities through a
  session change as well as current store jobs. Readiness requires healthy confirmed
  project AND task streams; activity remains nonblocking.
- Q17 overrides Q11/P5's sign-out confirmation. No confirmation was built; Auth sign-out
  is unchanged. Pending count lives at module scope in the SDK-free write facade, not
  the resettable session store or SDK `waitForPendingWrites`. Counts settle from the
  actual commit promises; a cascade also holds a scope between its batch commits.
  The unload handler is attached only while pending work exists, including after sign-out.
- Known limitation until v0.2: tab close is the only write-loss path covered by this
  memory-cache limitation. Sign-out
  does not discard queued writes; old-user writes can remain queued across account
  changes and acknowledge when that user returns. The unload guard is best effort,
  uses the browser's confirmation and does not create durable storage. No ack timeout,
  persistent cache, offline banner or sign-out confirmation was introduced.
- Q09 accepted limits remain: concurrent-device create/project-change races can leave
  hidden orphans, and cross-device exactly-once cascade summaries are not guaranteed.
  The three-listener in-memory join hides orphans; hiding them is not integrity proof.

## Changed files

- `src/lib/mutations/index.ts`, `src/lib/subscriptions/index.ts`, `src/main.tsx`:
  facade pending ownership, session identity and global unload handler lifecycle.
- `src/lib/write-plans.ts`, `src/lib/task-dates.ts`, `src/lib/dates.ts`,
  `src/lib/fake-data.ts`: pure mutations/events/batching, UTC date-only encoding,
  viewer-local end-of-day and fixture conversion. Explicit times remain instants.
- `src/store/index.ts`, `write-slice.ts`, `write-actions.ts`: session UI state, drafts,
  jobs, submitted recovery, no-duplicate coordination, toasts and cascade orchestration.
- `src/features/tasks/TaskFields.tsx`, `src/ui/{WriteOverlay,WriteUI,Toasts}.tsx`,
  `src/ui/Overlays.module.css`: shared form/Quick Add/dialog/notification interface.
- Shared shell/navigation: `src/app/{Shell,Navigation}.tsx`; project view:
  `src/features/projects/{ProjectPage.tsx,Project.module.css}`; shared rows/states:
  `src/ui/{TaskList.tsx,TaskRow.tsx,TaskRow.module.css,DataState.tsx}`;
  `src/styles/tokens.css`: geometry/presentation tokens and the existing breakpoint.
  New-project readiness is in a child control to preserve memoized navigation parents.
  New-task reveal scrolls the existing list without taking focus from Quick Add.
- Tests: new `tests/unit/{write-plans,write-actions,pending-guard,task-dates}.test.ts`
  and `tests/e2e/g3-crud.spec.ts`; updated unit/browser data-state tests for live actions.
  `tests/diagnostics/run-checkpoint2-monitor.mjs` implements only the declared paired monitor.
- Docs/evidence: Q17, this report, ROLLOUT, proposed rules patch, README, speed protocol/
  results, retained checkpoint-2 graphs/screenshots and per-run monitoring output.

## Ran versus only read

| Ran | Result / scope |
|---|---|
| `java -version` | Temurin 21.0.12.1; before emulator checks |
| `npm run build` | PASS; production mode with local `.env` Firebase config inlined; values not printed or edited |
| `npm run lint` | PASS after correcting an unused test parameter |
| `npm run typecheck` | PASS; app and test strict types |
| `npm run test` | PASS before monitor: 28 files, 217 passed, 1 skipped, 54.12 s. After recovery corrections: 219 passed, 1 skipped / 28 files, 76.47 s; New York-only DST case run separately below |
| Focused planner/actions/guard/dates/navigation tests | PASS: 5 files / 20 tests, 9.96 s |
| Focused recovery/guard/facade/navigation tests after corrections | PASS: 4 files / 12 tests, 8.84 s; recovered edit identity and pending project scope covered |
| Date helpers with process TZ `America/New_York` | PASS: all 3 tests, 1.90 s; spring-gap rejection, earlier fall occurrence, DST day end |
| Date helpers with TZ `Pacific/Honolulu` / `Asia/Shanghai` | PASS: 2 tests each, 1 timezone-specific skip each; 1.98 / 2.21 s; UTC components/local end-of-day round trip |
| `npm run test:rules` | PASS: existing 116 tests / 2 files, 11.92 s; current G2 rules only, not proposed tightening |
| `npm run e2e tests/e2e/g3-crud.spec.ts` | Initial run: 2 failed / 1 passed (selector ambiguity); corrected run: 3 passed, 15.6 s |
| `npm run e2e tests/e2e/g3-crud.spec.ts tests/e2e/data-states.spec.ts tests/e2e/shell.spec.ts tests/e2e/sync.spec.ts` | PASS: 13 tests, 1.7 min, retries 0; initial integration `fdb9a2f`, 390/1280 px and real emulator writes |
| `npm run e2e tests/e2e/g3-crud.spec.ts` after recovery corrections | PASS: 5 tests, 32.0 s; retained separately as `emulator-yMAl1D` |
| `node --test tests/diagnostics/analysis.test.mjs` | PASS: 3 tests, 134 ms; only summary/annotation verification, no new browser timing/profile |
| `npm run measure:bundle` | PASS; graph hashes match emitted JS/HTML; numbers below |
| Runtime SDK/listener/read source searches | Inspected all matches; runtime Firestore only in lazy adapter/listeners/test-only probe; registrations only in subscriptions; no added product one-shot reads |
| Production observer-marker search | No test-observer/write-probe module markers in output |
| `npm audit --omit=dev` | Exit 1: 4 carried high Node gRPC-chain findings; no automatic fix/dependency change |
| `rg -i grpc dist` plus module graph inspection | String match in deferred SDK; zero Node `@grpc`/`grpc-js`/Firestore Node module IDs across emitted chunks. String presence is not Node advisory reachability |
| `git apply --check docs/qa/gate-3/PROPOSED-RULES.diff` | PASS; validation only, never applied |
| Stable alias HEAD; GitHub combined status for `fdb9a2f` | HTTP 302; Vercel status success. Protected real-account UI remains owner-UNVERIFIED |

The first full unit run failed: navigation parent rerender assertion, 190 other tests
passed, plus two worker-start timeouts (`e2e-runner`, `write-plans`); 233.45 s.
The readiness subscription was moved into its child before the focused/full passes.
The first browser failure used ambiguous Status/progress locators; subsequent selectors
target the combobox role and exact progress label. Original failures remain in
`test-results/gate-3/emulator-jD3US9`; successful runs `emulator-nx9zq5`, `emulator-dh8BG2`;
rules `emulator-3E6Tt8`. Nothing was rerun to replace a speed result.

Only read: AGENTS, approved G3 skill, owner decision blocks, PLAN §3 additions/non-goals,
§4–6 and §10 common/G3, SCREENS G3 behavior, DESIGN/tokens, G2 document contract,
CONTEXT §6–8, current rules, existing subscription/auth/codec/test harness and G2 rollout.
Viewed task-form, Quick Add and dialogs frames and current 390/1280 form captures.
No rules tightening tests, rules deployment, live write, Production measurement, end-gate
acceptance/full e2e speed runs, manual second-device timing or end-gate review was run.
Q14's 20-submission Quick Add latency measurement remains for the end-G3 protocol;
working Quick Add browser coverage is not a substitute for that timing target.

## Bundle and carried risks

Normal production mode, local `.env` Firebase configuration inlined (not config-free),
final source `2a71db0`: initial / deferred / total **133,982 / 141,229 / 275,211 B gzip**.
Against G2 **127,820 / 137,162 / 264,982 B**: **+6,162 / +4,067 / +10,229 B**.
Initial margin **66,018 B**, strictly under 200,000 B. Firestore initial static/preload
reachability: none. Deferred/total are reported comparisons, not invented caps.
Only production graphs support those numbers; e2e build sizes are not substituted.
The earlier integrated measurement **133,866 / 141,230 / 275,096 B** is retained in
`production-bundle.json`; final metrics/graph use `final-production-*.json` instead.

Carried G2 evidence mismatch remains: final bundle metrics name entry `index-BEzxPrzy.js`
and four chunks; G2's graph instead names `index-bUZJVBSx.js`, one chunk and no edges.
Cause unproven; G2 evidence was not rewritten. Current graph hashes are checked.
The pending timestamp killed-stream defect fixed in checkpoint 1 remains fixed:
estimated server timestamps enter the structural codec; confirmed malformed values
remain errors. Production populated latency remains UNVERIFIED under Q10.
Thin `/tasks` and repeat-project p95 margin and all previous failed runs remain carried.
The only new speed run set is the owner-requested paired regression monitor below.

## Paired regression monitor (not acceptance)

One A1/B1/A2/B2/A3/B3 session, 60 samples each, 1,000 tasks, 4× CPU, tracing off.
Normal e2e builds, identical fake demo Firebase configuration and empty envDir on
both sides. No concurrent app test/build workload during the six timing runs.
[Manifest](checkpoint2-monitor-VNDDJq/manifest.json), [pooled/per-run summary](checkpoint2-monitor-VNDDJq/summary.json)
and [all route counts / >100 ms transitions](SPEED-CHECKPOINT-1.md#checkpoint-2-monitor-results-2026-10-25).

| Side | >100 ms | Pooled p95 / p99 ms | Slow repeat tasks→project |
|---|---|---|---:|
| Main `d16fe58` | 3/180 (1.67%) | 70.6 / 145.6 | 2 |
| Branch `fdb9a2f` | 2/180 (1.11%) | 72.9 / 100.9 | 0 |

Mixed: branch p95 +2.3 ms, but lower p99/slow share/repeat-project count, with differing
pair results. Not clearly worse in this session; three runs cannot establish absence
or presence of a regression. All 360 samples and commands are retained; no reruns.
Every run keeps three listeners, zero navigation-attributed requests and zero console
errors. This does not qualify as end-G3 Q15 acceptance. No additional diagnostics run.

After the monitor, functional code review found two correctness edges: recovered edits
lost their task identity when changed before retry, and pending local deletes could
leave no row from which to infer their project. `2a71db0` preserves original edit IDs
and facade-owned pending project scope, with two additional unit cases. Quick Add Enter
is also restricted to its title field so it cannot submit while operating native pickers.
These were correctness changes, not optimizations from the timing results. Focused/full
unit checks, G3 browser checks and production graph/size checks were repeated as listed.
The single retained monitor covers `fdb9a2f`, NOT these final corrections. No second
timing session was run; the results cannot establish final-head acceptance or absence
of regression. End-G3 Q15 acceptance is still required.

Retained [final production graph](checkpoint2-evidence/final-production-graph.json),
[final bundle](checkpoint2-evidence/final-production-bundle.json), earlier production
artifacts and six emulator sessions under
`checkpoint2-evidence/`; logs are normalized, sanitized by the existing runner, and
gzip-compressed. Final 390/1280 captures and browser observations are in
`checkpoint2-evidence/emulator-dh8BG2/`. Earlier failed commands are reported above
and in `checkpoint2-evidence/initial-check-failures.json`; originals remain retained.

## Rules review: proposed only

Review [the complete proposed diff](PROPOSED-RULES.diff). Its only tightening is
`createdAt == request.time` on create for projects, tasks and activity (Q06).
Writers already use server timestamps; existing immutable update checks stay intact.
No string caps (Q03), activity enum (P2), cross-document lookup, field, query, index,
delete coordination or read-policy change is proposed. Profile/unmatched access stays denied.
No lookup means no new 10-per-operation / 20-per-batch access-call exposure.

Read rules are ownership-only; write tightening cannot make existing documents unreadable.
G2 read queries and `seeded` string activity remain compatible. Privileged fixtures are
unchanged in field shape, with Q05's date-only values converted by the shared generator.
Real database: owner reported no collections/documents on 2026-10-24; no live migration
is needed. Non-server creation timestamps would fail future creates after tightening;
current G2 Production only reads. Preview/Production share one project, so deployment
or rollback affects both. Rules remain unchanged pending explicit checkpoint-2 approval.

## Owner handoff and proposed docs changes

Branch is pushed for the review worktree and Vercel. Stable alias host:
`taskly-v2-git-gate-3-projects-tasks-lunacedricks-projects.vercel.app`.
See [ROLLOUT](ROLLOUT.md) for exactly (a) Auth host, (b) emulator flags, (c) shared project,
(d) reviewed rules/deployment/publication, (e) Preview + second-device, (f) Production.
All six remain UNVERIFIED until owner reports; try the current-rules UI after (a)–(c).
GitHub's Vercel status for `fdb9a2f` is success ([deployment](https://vercel.com/lunacedricks-projects/taskly-v2/FQSWGe8oXRg8L1CcXw4pGKoqJasr));
the final functional source `2a71db0` is also success ([deployment](https://vercel.com/lunacedricks-projects/taskly-v2/449oyDfoSqrtewZn88BtUD3d59R4)).
anonymous HEAD on the stable alias returned 302. This verifies neither real Google
sign-in nor the protected UI/write checks. The agent did not bypass protection.

Proposals only, not applied: AGENTS no-COOP rule; PLAN Project-only G3 row mutations
(P1's exception to “from any screen”); CONTEXT §8 G2-only adapter-probe command.
Proposed PLAN rollout wording from the approved skill, not verbatim owner wording:
“In G3, after review and before merge, the owner deploys reviewed owner-only Firestore
rules if changed and verifies the approved G3 write flows on the Vercel preview with
real Google sign-in. The preview and manual second-device checks block marking G3
complete. The owner verifies Production after merge. These checks remain UNVERIFIED
until the owner reports them. The agent never deploys rules. G6 retains final deployment
verification.” No AGENTS, PLAN or CONTEXT edits, dependency installs, merge or deployment.
