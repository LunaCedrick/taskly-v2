# DECISIONS.md

A decision may change when a measurement says so. Write the change here first.

| Date | Decision | Why | Revisit if |
|---|---|---|---|
| 2026-10-13 | React + TypeScript + Vite | Recognized stack, type safety, fast tooling | Bundle budget is missed with no fix |
| 2026-10-13 | Firebase Auth + Firestore (modular SDK) | Free tier, real-time, owner-only rules | Quotas block use |
| 2026-10-13 | Flat `users/{uid}/tasks`, one listener | No indexes, simple rules, fast views | Task counts outgrow memory |
| 2026-10-13 | Single store, listeners started once | Fixes v1 navigation lag | Gate 0 or Gate 2 tests fail |
| 2026-10-13 | Zustand | Small, selector-based | Measurements say otherwise |
| 2026-10-13 | In-app alerts first | Push needs a paid backend | Owner decides to pay |
| 2026-10-13 | Codex builds, `AGENTS.md` plus one skill per gate | Small context, focused sessions | Rules exceed 8 KB or skills drift |
| 2026-10-13 | Scope additions: optional due time, automatic project colors, sort, category suggestions, project filter in My Tasks only | Smoother task management at low cost; see PLAN.md scope additions table | Cost grows beyond a small selector or field |
| 2026-10-13 | Due-time rule: no time means due at end of that day | One consistent rule for overdue and alerts | Owner changes the rule |
| 2026-10-13 | Native date and time inputs in v0.1, custom calendar later | Accessible and cheap; the calendar popover is costly | Native inputs fail owner review |
| 2026-10-13 | No Undo in v0.1 | Deletes already ask for confirmation; Undo adds restore logic | Owner asks for it |
| 2026-10-13 | Quick Add is a floating button on every screen | Always reachable, matches phone | Overlaps content in testing |
| 2026-10-16 | Firestore emulator on 8081 | Because 8080 is used by an Oracle listener on the owner’s machine. | Some files uses old 8080 emulator port |

## Gate 0 measurements

2026-10-18 review follow-ups, branch `gate-0-shell-speed`. Production build, 1,000 deterministic tasks, three projects.
Machine: DESKTOP-4HM6D76, AMD Ryzen 5 3400G (4 cores / 8 logical CPUs), 13.94 GiB usable RAM,
Windows 10 Pro x64 10.0.19045, Node 24.16.0, npm 11.16.0, Playwright 1.64.1,
Chromium 156.0.8078.4. Browser timezone: Asia/Shanghai.

Each speed run performs 60 trusted clicks between Dashboard, My Tasks, and Thesis, with CDP CPU
throttling at 4x. Timing starts in the click capture handler, waits for the target view and rows,
then crosses a rendering opportunity with two animation frames. The test fails when
nearest-rank **p95 >= 100 ms** (pass is strictly under 100 ms). No tracing during timing.
Initial fonts finish before navigation is measured. JSON includes median, p95, max, and all 60 samples.
These are lab interaction measurements, not field INP.

| Accepted run | Median ms | p95 ms | Max ms | Navigation requests | Result |
|---|---:|---:|---:|---:|---|
| 1 | 53.95 | 82.60 | 195.10 | 0 | pass |
| 2 | 47.60 | 75.60 | 224.60 | 0 | pass |
| 3 | 46.35 | 73.20 | 248.90 | 0 | pass |

Raw samples and machine details: `docs/qa/gate-0/speed-{1,2,3}.json`. These replace the older 20-click
measurements. Superseded raw JSON was removed per review; `docs/qa/gate-0/REVIEW.md` lists all 15 deletions.
**Risk:** the p95 budget passes, but the maximum observed transition remains above 100 ms in each run.

Virtualizer: its initial rectangle is seeded and overscan reduced from 5 to 3 (after a 100.60 ms p95 failure).
Navigation then needs no empty first render before the visible range is measured.

Earlier failing runs (20 clicks, kept in git history, commit 625eb3b): focus review 1 p95 100.60 ms;
initial diagnostics p95 143.80 / 148.70 / 197.30 ms. Causes and fixes: tracing, an extra frame, repeated style reads.

Final accepted informational comparison from 2026-10-17, virtualization disabled:
My Tasks median **1,137.7 ms**, p95 **2,088.4 ms**
(7 My Tasks transitions within 20 total route changes). See `speed-unvirtualized.json`.
This comparison is excluded from routine exit checks; reproduce with `npm run measure:unvirtualized`.

Final initial-load JavaScript baseline: **96,155 bytes gzip** (Node zlib default), 308,068 bytes uncompressed.
Vite reports **97.09 kB gzip** using its compressor settings. All routes are eagerly bundled;
the measurement script counts every emitted JS chunk, including shared chunks.
Interim target: about 100 kB gzip; hard budget: <200 kB. **Risk:** Firebase/Auth will add JavaScript
in later gates, so this baseline must be compared again before accepting those gates.

### Gate 0 implementation decisions (owner approved 2026-10-17)

Lighthouse 13.5.0, default mobile simulated throttling (150 ms RTT, 1,638.4 Kbps, 4x CPU),
production shell with the same machine and Chromium listed above:

| Audit | Performance | Accessibility | LCP ms | Total blocking time ms | Result |
|---|---:|---:|---:|---:|---|
| Final accepted, 2026-10-18 | 99 | 100 | 1856.726 | 88.5 | pass |

Only the final accepted audit is retained in `docs/qa/gate-0/lighthouse.json`.
Final audit: zero failing accessibility audits. Raw Lighthouse HTML/JSON/trace are generated in
ignored `test-results/` by `npm run lighthouse`; compact scores/configuration are committed.

- Extend the existing scaffold; no Firebase package, auth, listeners, or data writes in this gate.
- Virtualize My Tasks and Project view only above 200 rows. Dashboard uses the complete overdue,
  today, and upcoming selectors but renders two rows per group, without virtualization.
- Lists expose `role="list"`, `aria-setsize`, and `aria-posinset`. Large lists support Arrow Up/Down,
  Home/End with a roving tab stop. The focused row remains mounted when scrolling away.
- The phone Projects tab opens the project drawer (the existing menu drawer), because G0 has no `/projects` index route. Recorded in SCREENS.md.
- The 820 px breakpoint is the sole media-condition size exception, in `src/styles/tokens.css`.
  CSS custom properties cannot be substituted into media query conditions. No duplicate breakpoint.
- Self-host Latin WOFF2 variable fonts with `font-display: swap`, both critical font preloads, and OFL
  license files. Instrument Sans: 30,092 bytes; Newsreader: 58,084 bytes. Both retain variable weights;
  Newsreader fixes optical size at 16, saving 73,916 bytes versus the initial optical-size variable font.
  No navigation font requests.
- The temporary favicon is `data:,`. Page title is `Taskly`, following the owner's Gate 0 instruction.
- `vercel.json` rewrites every path to `/index.html`. No Cross-Origin-Opener-Policy header is configured.
- Lighthouse runs through pinned `npx --yes lighthouse@13.5.0` in an npm script; it is not a dependency.

## Gate 1 measurements

2026-10-19: implementation plan and exact-pinned `firebase@13.0.0` approved by the owner.
Keep `firebase.json` (including its emulators block) unchanged. Add no UI for missing/invalid
configuration or sign-out failures. All required Gate 1 targets now have passing automated or
owner-reported evidence, as recorded below; the tracker is ticked, pending owner review/merge.

### Known gaps (no UI by owner decision)

- Missing/invalid `VITE_FIREBASE_*`: `getFirebaseApp()` in `src/lib/firebase/client.ts`
  throws for missing required values during `startSession()` in `src/main.tsx`, before React
  renders. Missing values or other synchronous configuration/Auth failures leave a blank page
  and a console error.
- Sign-out failure: `signOutAction()` in `src/features/auth/auth-actions.ts` swallows the
  error. The user stays signed in with no message and can retry.

The E2E runner requires a globally installed `firebase-tools` on PATH (15.34.0 used here).
It locates that installation's JavaScript entry point and does not install the CLI itself.

### Bundle measurements

Adapter-only size check, before auth UI, store, guards, or bootstrap changes:
`npm run measure:auth-adapter` builds the same scaffold twice in memory, retaining every adapter
export in the second build so popup/sign-out code cannot be removed as unused. Both builds count
every emitted JavaScript chunk using Node's default gzip settings. Firebase App/Auth imports only;
no Firestore imports. Node 24.16.0, Vite 8.3.4.

| Measurement | Bytes gzip |
|---|---:|
| Recorded Gate 0 baseline | 96,155 |
| Matched committed scaffold baseline | 96,155 |
| Committed scaffold plus complete Auth adapter | 124,127 |
| Adapter increase against matched baseline | 27,972 |
| Owner stop threshold (exceeded only above this value) | 50,000 |

Result: pass. The initial working-tree check, before building the interface, measured 96,160 to 124,132 bytes;
its 27,972-byte increase is preserved in commit `983bd86`. The reproducibility check loads the
committed Gate 0 scaffold (`6a99bb5`) in memory and reproduces the original 96,155-byte baseline,
with the same 27,972-byte increase. Evidence: `docs/qa/gate-1/auth-adapter-bundle.json`.
The measurement exposes all adapter exports only in an in-memory build. The initial working-tree
pair and frozen-scaffold reproduction are distinct matched builds; both have the same 27,972-byte delta.
Controlled env/no-env builds gave full JS 126,224/126,111 bytes and adapter increases 27,972/27,869;
inlined env values explain roughly 100 bytes of gzip variation. No real env file was changed.

Installation added 82 packages. `npm audit` reported 4 high advisories through the unimported
Firestore/gRPC dependency chain. No dependency override, downgrade, or automatic fix was applied.
Review follow-up: `npm audit --omit=dev` again reports 4 high and 0 other advisories; current
Auth-only `dist` has 0 case-insensitive `grpc` matches. After the Gate 2 Firestore import and
production build, repeat both `npm audit --omit=dev` and `rg -i "grpc" dist` before assessing exposure.
Final build, lint, and strict typecheck pass. Unit/component tests: 72 across 8 files; exit run
8.70 s, review rerun 6.67 s. Browser tests: 24 passed in the exit run (1.5 min) and again during
review (1.8 min), including authenticated shell, keyboard/drawer behavior, and navigation speed.
Production JavaScript: 126,224 bytes gzip (409,110 uncompressed), a 30,069-byte increase over
Gate 0, below the 200,000-byte budget. All commands and hard-rule checks in the review skill passed.

Navigation uses 1,000 fixture tasks, 60 trusted-click transitions per run, 4x CPU, fonts/auth
settled before measuring, and no tracing. Timing still crosses the route commit and paint using
the original two-animation-frame protocol. No samples or auth errors were excluded.

| Run | Exit median / p95 / max ms | Review median / p95 / max ms | Review >100 ms | Requests / console errors |
|---|---|---|---:|---|
| 1 | 48.65 / 69.90 / 140.70 | 53.60 / 66.30 / 143.00 | 1 | 0 / 0 |
| 2 | 48.05 / 59.50 / 136.50 | 56.15 / 78.20 / 199.40 | 2 | 0 / 0 |
| 3 | 47.75 / 57.60 / 137.80 | 53.35 / 75.30 / 140.60 | 1 | 0 / 0 |

Each exit run had one transition over 100 ms. All six runs pass strict p95 <100 ms; maxima
remain above 100 ms. Review raw samples and machine details: `docs/qa/gate-1/speed-{1,2,3}.json`.
Machine: DESKTOP-4HM6D76, AMD Ryzen 5 3400G, 8 logical CPUs, 13.94 GiB RAM, Windows 10.0.19045,
Node 24.16.0, Chromium 156.0.8078.4, browser timezone Asia/Shanghai.
Gate 0's DECISIONS.md p95 reference was 82.60 / 75.60 / 73.20 ms at the same 4x CPU setting.

An earlier full run failed at p95 104.20 and 112.90 ms. Its three raw runs are retained under
`docs/qa/gate-1/diagnostics/before-navigation-memo/`. Memoizing Navigation and Drawer avoids
recomputing unchanged navigation/profile trees on each route; NavLink context and store selectors
still update. Two complete post-fix runs passed. The sample count and failure threshold are unchanged.
Emulator browser setup now waits for the popup widget's DOMContentLoaded event before clicking.
Cancellation assertions allow the SDK's intentional eight-second auth-event grace period.

Nineteen screenshots cover the shell/drawer and auth states at 390 and 1280 px. Visual comparison,
phone adaptations, contrast ratios, scope checks, and proposed lessons are in `docs/qa/gate-1/REVIEW.md`.
No horizontal overflow or keyboard/focus regressions were found. Auth text/background contrast
pairs range from 4.71:1 to 13.79:1; focus targets are at least 44 px and outlines at least 3 px.

Preview: https://taskly-v2-git-gate-1-auth-lunacedricks-projects.vercel.app/
Normal `git push` published application commit `b3ffa18`; GitHub's Vercel status reports
"Deployment has completed". This environment is redirected to Vercel sign-in; the Vercel CLI
also has no authentication token. No external project settings were changed.

The owner supplied passing real-Google preview results on 2026-10-19; these were not independently
repeated by the agent. Chrome 155.0.8059.84 (Official Build, 64-bit), Windows 11 desktop/laptop
(model not recorded), fresh profile, no extensions. Timing conditions: Slow 4G and 4x CPU slowdown;
functional checks used no throttling.

| Run | Popup close to visible Dashboard (ms) | Separate popup-open/account-selection interval (ms) | Result (<3000 ms) |
|---|---:|---:|---|
| 1 | 198.1 | 15,896.2 | PASS |
| 2 | 43.4 | 6,069.8 | PASS |
| 3 | 101.1 | 6,021.3 | PASS |
| Median | 101.1 | Excluded from sign-in interval | PASS |

Start: first observed Google popup closure after account selection. End: visible Dashboard
`header h1` in the shell. The console-only snippet observes closure with 20 ms polling/focus and
heading visibility with DOM observation/polling. Popup-open time includes provider-page loading.
Wall-clock start/end timestamps were not supplied; no timestamps or device model were inferred.

| Required preview evidence | Owner result |
|---|---|
| Real Google sign-in | PASS in all three timing runs |
| Refresh persistence | PASS: loading screen, then Dashboard; no sign-in form flash |
| Sidebar sign-out | PASS: protected content gone; refresh still requires sign-in |
| Phone drawer sign-out | PASS at 390x905 emulation: protected content gone; refresh still requires sign-in |
| Requested deep-link return | PASS: `/projects/project-1?sort=due#task-2`, Thesis project visible |

The owner observed four `Cross-Origin-Opener-Policy policy would block the window.closed call`
messages per timing run and attributed them to the measurement snippet's cross-origin popup
polling, not Taskly. The agent did not independently inspect their call stacks. No app code or
COOP header was changed. Raw structured evidence is in `docs/qa/gate-1/preview.json`.
Firebase/Vercel console settings and Production authentication were not directly audited by the
agent; successful Preview behavior does not claim that separate audit. All required G1 targets
now have passing automated or owner-provided evidence; G1 is marked complete in the tracker.
The branch still awaits review and the owner's merge.

### Review follow-up (base `be43ece`)

Added 2 tests comparing the real `firebase.json` Auth/Firestore ports with the shared constants,
and 1 simulated CLI startup-failure test. Build, lint, strict typecheck and review checks pass:
75 unit/component tests in 10 files (7.56 s); browser exit/review runs each pass 24/24 (1.7/1.8 min).
Review route median/p95/max: 57.60/68.40/176.00, 53.85/69.20/162.50, 58.60/85.10/173.60 ms;
1/1/3 transitions over 100 ms, 0 requests and 0 app console errors in each 60-transition run.

The Claude Code review run's fresh-worktree 90-second startup failure and successful whole-command rerun are
recorded in REVIEW.md; Playwright retries remain 0. The failed temp directory has config only,
with no Firebase debug log. A pre-logging CLI stall is possible; cold-start/root cause is unresolved.
Captured diagnostic/exit/review startups took 11.480/12.553/11.892 s, with first output at
1.399/1.434/1.401 s. The deadline stays 90 seconds. stdout/stderr, debug logs and startup/probe
diagnostics are retained in `test-results/auth-emulator-*/`.

Routine measurements/screenshots now go to `test-results/gate-1/`; updating committed artifacts
requires `--record-evidence`, designed by Codex in response to the Claude Code review findings. All 28 pre-existing committed JSON/PNG
artifacts are byte-identical to `be43ece`. Follow-up results: `docs/qa/gate-1/review-followup.json`.
Preview timings and console setup confirmations remain owner-reported, not independently verified.

Runner-test correction (base `5690a7c`): a test-only child preload isolates port checks and
readiness fetches; the real runner is unchanged. Added a 9099-occupied regression case.
Build/lint/strict typecheck pass; normal unit suite 76/76 in 10 files (7.43 s), separate full suite
with an external listener holding 9099 also 76/76 (7.40 s). Browser suite 24/24 (1.6 min);
route p95 59.2/58.7/59.8 ms, 0 navigation requests/app errors. Attribution and stale tracker
status corrections are recorded in REVIEW.md and review-followup.json.

## G2 owner decisions (2026-10-22)

G2 owner decisions:
Q01 Initial JS = entry + transitive static imports + modulepreloads, deduplicated, under 200,000 B gzip. Report deferred and total next to it. Only an owner-approved PLAN change can alter the budget.
Q02 Drop the 50,000 B threshold for the lazy path.
Q03 I deploy firestore.rules myself after review and before merge. The agent never deploys. I verify first-run on the preview before merge, and Production after merge. Mark these UNVERIFIED until I report. My preview check blocks marking G2 complete.
Q04 The populated demo runs on the seeded emulator.
Q05 Orphan tasks are excluded from all views and counts. Expose orphanCount in store state for tests. No new UI. Cover with tests.
Q06 Unknown project id after load: "Project not found" with a Dashboard link, no retry button. Skeleton before load.
Q07 `now` is the publication-time wall clock. The minute tick is left to G5.
Q08 An empty snapshot from cache stays on the skeleton. If no server confirmation arrives within 10 s, show the load-error state with "Try again". Retry restarts the wait. Timers are cleared on stop and sign-out. Verify in the emulator.
Q09 Non-blocking Lighthouse report using the existing script. No G2 Lighthouse, LCP or INP pass conditions.
Q10 Defer both write files to G3.
Q11 Approve explicit validating matches. Propose the PLAN §5 wording.
Q12 No profile access until its contract is approved.
Q13 Firestore timestamps on disk, numeric ms in the UI, decoded structurally. Confirm this matches PLAN §5 before building.
Q14 Explicit field allowlist and a required-field matrix. Show me the matrix in the plan.
Q15 Nullable activity references; required string project reference on tasks.
Q16 Activity type is a string until G3 defines the writers.
Q17 No string length caps. colorIndex is bounded by the existing palette. createdAt is immutable.
Q18/Q19 State what G0 Quick Add does. Use the same treatment for the first-run and empty-project actions.
Q20 Approve @firebase/rules-unit-testing as a dev dependency if its peer range accepts firebase@13.0.0, the pin stays exact, and the lockfile diff is dev-only. Seed with withSecurityRulesDisabled in batches of at most 500.
Q21 Fail any navigation-caused request or new Firestore channel in the click-to-paint window. Record established transport traffic separately. Mark uncertain attribution UNVERIFIED, not passed.
Q22 The branch is gate-2-store-and-sync. PROMPTS.md is fixed to match.
Q23 Projects and tasks gate the views. Activity readiness and errors are tracked and exposed in the store but never block G2 views. A projects or tasks failure replaces the views with the states.png load-error panel; the store keeps already-loaded data so a successful retry restores the views without a skeleton flash. "Try again" replaces only the failed streams. An activity-only failure shows no UI in G2: it stays visible in store state and is retried by the next explicit retry or a reload. The three-listener and exactly-three-after-recovery targets are unchanged.
A The Firestore cache is memory-only in G2. No persistent cache, no IndexedDB persistence.
B Load-error copy is exactly as written in states.png, and follows Q23.
C A "Carried lessons" block (dated, condensed from G0 and G1, no new content) is allowed outside the five-lesson cap.
D Emulator startup keeps one shared 90 s deadline, unchanged. Reuse demo-taskly-auth and record that the name is now a misnomer.
E The approved skill lands on main through a docs branch first. The gate branch is created from the updated main afterwards.
F Status uses the string already in src/lib/types.ts, with no mapping layer. Title is required and non-empty.

### Implementation-plan approval — owner, 2026-10-22

The owner approved the implementation plan with these answers. The following P1–P8 statements are the owner's words:

P1 Yes: dates are stored as Firestore timestamps and the UI keeps numeric ms. PLAN §5 is silent on storage types, so add this as a fourth proposed PLAN wording (do not edit PLAN.md). Carry to G3: a locally pending serverTimestamp reads as null, so the G3 codec must handle pending writes (for example serverTimestamps: "estimate"). Record this in DECISIONS.md.
P2 Yes, these are the intended exceptions: the PLAN wording changes, Q06's minimal not-found state, F's title rule and the literal in-progress status. Do not expand any other G3 or G6 scope.
P3 Field matrix approved as proposed. Note in the tests that colorIndex 0-5 is tied to the palette size.
P4 Title must contain at least one non-whitespace character. Reject whitespace-only titles and never rewrite stored text. Test a multi-line title.
P5 The 10 s wait starts at listener registration; each retried stream gets a fresh deadline. Verify the SDK's real offline behavior in the emulator tests rather than assuming it.
P6 Initial readiness waits for server confirmation, even if a non-empty cache snapshot arrives first.
P7 A timeout error recovers automatically if the server later confirms (the listener is still registered; handle count stays 3). An error from the listener's own error callback needs "Try again". Test both.
P8 Approved: effective-data equality. Add the PLAN §13 clarification ("compare decoded effective data; no version field exists") to the proposed PLAN wording.

**G2 rollout owner record (2026-10-23):** Historical approved-plan setup requirements (agent-authored): leave an existing database alone; authorize exact hosts, never all vercel.app; keep emulator flags unset; the agent never deploys. Owner-verified setup: Firestore (default) exists in asia-southeast1, Vercel Preview/Production checked, both flags unset, G2 alias authorized. Preview and Production share one Firebase project (identical VITE_FIREBASE_PROJECT_ID, owner-verified 2026-10-23), so the rules deploy and any rollback affect both. Rules deployment, published-rules confirmation and preview are VERIFIED by owner below; Production remains UNVERIFIED until after merge. Historical scope: This approval authorizes steps 2–3 only for this work session. Stop after the adapter measurement and report sizes, import-graph evidence, and the decision record before any later implementation. (Historical session limit; superseded by the continuation request dated 2026-10-23 authorizing steps 4–15.) The following four statements are recorded exactly as stated by the owner:

- **Owner, 2026-10-23 (verbatim):** I authorized the firebase.json location change (nam5 -> asia-southeast1) in my earlier fix prompt.
- **Owner, 2026-10-23 (verbatim):** I accept the speed record for merge: meets the strict p95 < 100 ms target, with one retained failed run out of 18 and the cause unproven; carried to G3.
- **Owner, 2026-10-23 (verbatim):** On 2026-10-23 I deployed firestore.rules from f92fb4b with `firebase deploy --only firestore:rules --project taskly-v2`. The console Rules tab showed it published at Oct 23, 3:54pm, and the text matches the reviewed file.
- **Owner, 2026-10-23 (verbatim):** Preview check on 2026-10-23, fresh Chrome profile, 155.0.8059.85 (Official Build) (64-bit) (cohort: Stable), Windows 11, commit f92fb4b: real Google sign-in worked; first-run state shown; no load error after 15 s; Dashboard and My Tasks showed no load error; 0 console errors; reload kept the session; sign-out returned to sign-in.

### Proposed PLAN wording for the owner (not applied)

The [five proposed wording changes](qa/gate-2/PROPOSED-PLAN-CHANGES.md) are retained separately to keep this decision log within 300 lines. No PLAN edit has been applied.

**Step 3 checkpoint — agent measurement, 2026-10-22:** Matched G1 baseline 126,223 B gzip; lazy read adapter 126,799 B initial + 134,622 B deferred = 261,421 B total (+576 B initial, 73,201 B initial headroom). Extended measurement-only write exports: 126,799 + 138,163 = 264,962 B, another 3,541 B deferred. No Firestore runtime in initial static/preload closure; eager control rejected. The adapter stays unwired. Signed-in transfer, 4x CPU first-data latency, and emulator timing remain UNVERIFIED. Stop after step 3 as authorized. See [measurement report](qa/gate-2/ADAPTER-MEASUREMENT.md) and its graph evidence; P1 above retains the G3 pending-timestamp carry-over.

**G2 startup investigation — agent, 2026-10-23:** Continuation prechecks passed (125 full tests; evidence command changed only G2, with all 14 G0 and 32 G1 evidence files unchanged). The initial CLI-version preflight timed out before emulator spawn and was replaced with validated manifest discovery. The first actual CLI start emitted its banner at 67,273 ms, but neither emulator became usable within 90 s. Bootstrap delay is observed; its root cause and the historical G1 timeout remain unproven. The shared 90 s deadline is unchanged. Carried reviewer observations: cold readiness 64.3 s / first output 23.2 s; each reviewer speed run had one Dashboard -> My Tasks sample over 100 ms (108.6 / 108.2 / 121.6 ms), with p95 passing. These are reviewer-reported observations, not new agent measurements. [Retained startup diagnostics](qa/gate-2/EMULATOR-STARTUP.md). Later checks and local review: build/lint/typecheck, 195 unit tests, 116 rules tests and 31/31 browsers pass; review navigation p95 54.9/55.1/57.4 ms with zero click-to-paint requests and three registrations unchanged. The acceptance repeat was 59.8/59.7/64.8 ms. Rollout fixes: the adapter script validates its own in-memory builds without prior dist/test-results (isolated clean-checkout regression passes); full unit suite 196/196 in 23 files, lint/typecheck/build pass; production observer marker/module/installer grep exits 1 with no matches. All four Firebase configuration tests pass; only the owner-authorized location changed, with emulators/ports unchanged. Initial browser check 30/31: p95 104.8/81.8/72.6 ms, first run failed. One bounded unchanged verification passed 31/31: p95 68.6/74.7/68.2 ms; zero navigation requests and three registrations unchanged. Each verification run had one Dashboard -> My Tasks sample above 100 ms (118.1/100.2/105.6 ms). Both complete sample sets are retained in [rollout-fix verification](qa/gate-2/rollout-fixes-speed/README.md); initial-1 had first visits #0 / -> /tasks 151.4 ms and #1 /tasks -> /projects/project-1 108.0 ms, plus repeat visits #10 104.8 ms and #13 166.2 ms on that project pair (new versus earlier G2 runs). With 60 samples p95 is fourth-largest. No request started in a click-to-paint window; only the pre-existing listen backchannel was in flight, registrations 3 -> 3, zero console errors. Rollout fixes do not touch navigation: subscriptions/index.ts runs once per session start, e2e behavior unchanged. Likely main-thread jitter; cause UNPROVEN. Combined retained G2 record: 18 runs, 17 passed and 1 failed (104.8 ms), including reviewer runs at f92fb4b with p95 73.1/61.4/66.8 ms and zero samples above 100 ms. Carry thin margin on /tasks and project-route transitions, including repeat project visits, to G3; no sample was excluded and no threshold changed. Setup, the shared Firebase project, rules deployment, published-rules confirmation and real-Google preview are VERIFIED by owner on 2026-10-23 in ROLLOUT and the verbatim statements above. Preview and Production share one Firebase project; the rules deploy and any rollback affect both. Existing local checks and the owner-accepted strict p95 record verify all required G2 targets: G2 is complete pending owner merge. Production stays UNVERIFIED until after merge; rollback was not performed. [Local review](qa/gate-2/REVIEW.md), [owner rollout handoff](qa/gate-2/ROLLOUT.md). Production bundle after rollout fixes: 127,820 B initial / 137,162 B deferred / 264,982 B total gzip; no Firestore in the initial static/preload closure. Audit exits 1 with four high package entries, propagated from grpc-js 1.9.16 (GHSA-m9gg-hp2v-232j high; GHSA-f596-whhp-79r4 low). The affected Node implementation does not reach any browser chunk: the graph selects Firestore browser ESM, with zero @grpc/proto-loader/protobufjs/Firestore-node modules. The dist grpc search exits 0, matching only status/configuration strings. The installed dependency remains vulnerable; no automatic fix or pin change. [Audit and browser assessment](qa/gate-2/dependency-audit.txt), [dist search evidence](qa/gate-2/grpc-search.txt). Existing Lighthouse script skipped because it writes committed G0 evidence; no G2 Lighthouse/LCP/INP pass condition.

**Early step 6 measurement — agent, 2026-10-23:** With 1,000 emulator tasks, Slow 4G and 4× CPU: resolved sign-in to confirmed data 7,969 ms, to the following two-frame paint 8,035 ms (6 rendered rows), full navigation to data paint 11,422 ms; observed startup encoded transfer 1,149,993 B. Three active listeners/registrations, server-confirmed projects/tasks/activity, zero orphans and console errors. Breakdown: navigation-to-Auth restore 3,387 ms (lookup request 714 ms); Firestore chunk download 1,377 ms, then 20 ms to registrations (parse/init not separately isolated); first listen-response bytes 628 ms after its request; stream first-to-last observed bytes 4,365 ms; last bytes to task callback 919 ms (SDK processing/scheduling, not isolated decode), callback to publication 43 ms, publication to paint 66 ms. Overlapping intervals must not be summed. JS negotiated gzip; the Firestore stream supplied 785,658 B without Content-Encoding. Its original response body was not retained. A separate full-UI capture yielded 784,047 B of payload, gzipping to 23,115 B at level 6 (roughly 23 KB for the original 786 KB); this is a best-case lower bound because fake-data.ts repeats nine base titles (numeric suffixes), one description and empty categories (captured ratio 2.95%). A reviewer synthetic of the same wire shape gave 5.2% for fake-data text versus 18.1% for varied text; those are indicative reviewer results, not a new measurement here. The realistic range is UNVERIFIED. About 4.4 s of the 8.035 s comes from the uncompressed 785,658 B emulator stream at the 180,000 B/s Slow 4G profile; the emulator figure is not a Production prediction. Follow-up app callback processing was projects 1 / tasks 41 / activity 2 ms, with SDK processing outside that interval. [Breakdown and follow-up evidence](qa/gate-2/STARTUP-MEASUREMENT.md). These are instrumented early-build/emulator observations; unfinished-stream headers are excluded. Owner's continuation answer, 2026-10-23: continue unchanged; 8.035 s is a measurement, not pass/fail; the owner will decide after G2 on a first-data target or mitigation. No Firestore preloading or listener-contract change. The empty-account preview cannot reproduce this 1,000-task case. [Raw evidence](qa/gate-2/startup-early.json). Corrected readiness: Auth 12,298 ms, Firestore 6,664 ms, first CLI output 1,221 ms; shared 90 s deadline unchanged.
