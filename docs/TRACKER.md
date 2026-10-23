# TASKLY v2: TRACKER.md

Where we are: Phase B, Gate 2 implementation/local review pass; owner setup, rules deployment and deployed-preview verification remain UNVERIFIED. G2 stays unchecked. Update this file after every step (tick the box, add a log line).
Owners: **You** = Cedrick, **Claude** = planning, design, and review in chat, **Codex** = builds code.
Targets for each gate are in `docs/PLAN.md` section 10 and in the gate's skill.

Gate rhythm: new session, plan first, build on a branch, run the exit commands, run the `review` skill, open a pull request, Claude reviews, you merge, lessons go into the skill, tick the box.

## Phase A: Foundation
| ID | Step | Owner | Done when | Status |
|---|---|---|---|---|
| A1 | Plan v2 written and approved | Claude, You | `PLAN.md` approved | [x] |
| A2 | Designs approved: 20 canvas frames covering every v0.1 page | Claude, You | Canvas approved | [x] |
| A3 | Workflow agreed | Claude, You | You say yes | [x] |
| A4 | Starter pack delivered | Claude | Files delivered, `AGENTS.md` under 8 KB | [x] |
| A5 | New GitHub repo, pack pushed, old repo tagged `v1-prototype`, canvas frames exported to `docs/design/` | You | `main` has the pack | [x] |
| A6 | New Firebase project: Google sign-in on, Firestore created, web app registered, config in `.env` | You | `.env` works locally | [x] |
| A7 | Vercel connected, `VITE_FIREBASE_*` set for Production and Preview | You | A branch push gives a preview URL | [x] |
| A8 | Codex sees all of `AGENTS.md` (last heading "Reports") and lists the skills | You | Heading matches | [x] |

## Phase B: Build
| Gate | Pages delivered | Key targets | Status |
|---|---|---|---|
| G0 Shell and speed | App shell: sidebar, topbar, phone top bar, bottom tab bar, menu drawer; Floating Quick Add button (visible, not wired yet); Placeholder Dashboard, My Tasks, Project view rendering 1,000 fake tasks; ... | Median and 95th percentile route-change time recorded; 95th percentile under 100 ms with CPU throttled 4x; Zero network requests during navigation; ... | [x] |
| G1 Authentication | Sign in (desktop, phone stacked); Session check screen (app start); Sign-in error state (popup blocked, network, cancelled); ... | Signed-out visit goes to /sign-in, then returns to the requested route after sign-in; A page refresh keeps the session; ... | [x] |
| G2 Store and sync | Dashboard, My Tasks, Project view now read real data (read-only); States: loading skeleton, first run, empty project, load error | Exactly 3 Firestore listeners during navigation (automated test); A burst of 100 snapshot updates causes at most 1 render per frame; ... | [ ] |
| G3 Projects, tasks, Quick Add | Task form: modal on desktop, bottom sheet on phone, add and edit; Dialogs: new project, rename project, delete task, delete project; Quick Add: floating button live, popover on desktop, sheet on phone, "More options" opens the full form; ... | Quick Add takes at most 3 steps: open, type, Enter; The new task appears under 100 ms after Enter (optimistic); ... | [ ] |
| G4 Dashboard | Dashboard (desktop and phone): stat cards, Overdue, Today, Upcoming, Recent activity; Complete a task in place | Selectors unit-tested, including end of day, a set time, time zones, and empty data; The dashboard is derived from memory, with zero requests on navigation; ... | [ ] |
| G5 Search, filters, sort, alerts | My Tasks with search, filters, sort, and removable filter chips; Project view filters and sort; Phone: search bar and filter sheet; ... | Search plus filter plus sort over 1,000 tasks completes in under 50 ms (measured in a test); typing stays responsive; Filters combine correctly (unit tests); the project filter exists only in My Tasks; ... | [ ] |
| G6 QA and deploy | Project not found; Final polish across every page against the canvas; README | Lighthouse mobile: performance 90 or higher, accessibility 95 or higher, no critical axe violations; Keyboard-only walkthrough of every page passes; ... | [ ] |

Common to every gate: route change 95th percentile under 100 ms (1,000 tasks, CPU throttled 4x); lint, typecheck, unit and end-to-end tests pass; no console errors; no horizontal scroll at 390 and 1280 px; the `review` skill is run.

## Phase C: Release
| ID | Step | Owner | Done when | Status |
|---|---|---|---|---|
| R1 | Production deploy checked on desktop and phone | You | Live URL works end to end | [ ] |
| R2 | Portfolio updated with the new Taskly scene | Claude, You | Live portfolio shows v2 | [ ] |
| R3 | Retrospective, lessons folded into skills | Claude, You | Lessons recorded | [ ] |

## Later (v0.2 and v0.3)
Offline sync, settings page, installable app, offline banner, custom calendar, Undo, then push notifications if a backend is ever paid for.

## Log
| Date | Step | Note |
|---|---|---|
| 2026-10-23 | G2 local implementation and review | Lazy Firestore boundary; three session listeners, bounded incremental frame batching, confirmed-data gating, safe real-data views and owner-only validating rules. Build/lint/typecheck pass; 195 unit tests, 116 rules tests, 31/31 browsers pass. Review navigation p95 54.9/55.1/57.4 ms, zero navigation requests, three listeners unchanged. Initial/deferred/total gzip 127,835/137,163/264,998 B. Early Slow 4G/4x data paint 8.035 s is a measurement only; gzip estimate and timing breakdown recorded. Audit remains four high entries; affected Node grpc-js is absent from the browser graph. Startup failures/logs retained; shared 90 s unchanged. Owner rollout/preview required; G2 not complete. See `docs/qa/gate-2/REVIEW.md` and `ROLLOUT.md`. |
| 2026-10-22 | G2 steps 2–3 checkpoint | Owner P1–P8 recorded in first gate commit `e469443`. Isolated memory-only adapter remains unwired. Matched gzip: baseline 126,223 B; lazy read 126,799 B initial + 134,622 B deferred = 261,421 B total; measurement-only write exports add 3,541 B deferred. Initial headroom 73,201 B; static/preload graph excludes Firestore and eager control is rejected. Build/lint/strict typecheck pass; 117 tests in 13 files pass (33.57 s). Java 21 available. Lighthouse skipped to preserve G0 evidence. Runtime transfer/latency, emulators, rules, integration, and owner live checks remain pending. Stopped at step 3; G2 remains unchecked. See `docs/qa/gate-2/ADAPTER-MEASUREMENT.md`. |
| 2026-10-19 | G1 runner-test isolation and record corrections | Real runner unchanged; test-only child network isolation plus a 9099-occupied regression case. Build/lint/strict typecheck pass; 76 tests in 10 files both normally (7.43 s) and with an external listener holding 9099 throughout (7.40 s). Browser tests 24/24 (1.6 min); route p95 59.2/58.7/59.8 ms, 0 requests/app errors, one >100 ms transition per run. Corrected Claude Code review / Codex design attribution and application reference to 5690a7c; preserved the stale G1 row with a superseded marker. See `docs/qa/gate-1/REVIEW.md`. |
| 2026-10-19 | G1 review follow-up | Added 2 real-config/shared-port tests and 1 startup-failure/log-retention test. Build/lint/strict typecheck pass; 75 unit/component tests in 10 files, 24/24 browsers in both exit/review runs. Review p95 68.4/69.2/85.1 ms, 0 requests/app errors, 1/1/3 transitions >100 ms. Captured emulator starts 11.480/12.553/11.892 s; historical Claude Code review 90-second failure not reproduced, cold-start cause unproven. Routine outputs now use test-results; Codex designed explicit --record-evidence for committed copies in response to the review findings. All 28 existing JSON/PNG artifacts unchanged. Known gaps, global CLI prerequisite, env-size variation and distinct adapter baselines documented. Audit --omit=dev: 4 high; repeat audit/dist grep after G2 Firestore import. See `docs/qa/gate-1/REVIEW.md`. |
| 2026-10-19 | G1 owner preview verification | Owner reports real Google sign-in, refresh persistence without form flash, sidebar and 390x905 drawer sign-out, and exact deep-link return PASS. Chrome 155 / Windows 11, fresh profile, no extensions; Slow 4G / 4x CPU timings 198.1/43.4/101.1 ms, median 101.1 ms (<3000); separate popup-open intervals 15,896.2/6,069.8/6,021.3 ms. Functional throttling off. Four COOP messages/run attributed by owner to measurement polling; no app change. All required targets verified; G1 ticked, branch awaits review/owner merge. See `docs/qa/gate-1/REVIEW.md` and `preview.json`. |
| 2026-10-19 | G1 local checks and review (superseded by later rows) | Build, lint, strict typecheck, 72 unit/component tests, and 24 emulator browser tests pass; review rerun passes. Review route p95 66.3/78.2/75.3 ms, 0 requests/errors, 1/2/1 transitions over 100 ms. JS 126,224 bytes gzip; adapter-only increase 27,972 bytes. Pushed normally through application commit `b3ffa18`; Vercel reports deployment complete. Real-Google preview checks and all three throttled timings/account-selection intervals remain UNVERIFIED pending owner results. G1 remains unchecked. See `docs/qa/gate-1/REVIEW.md`. |
| 2026-10-19 | G1 session and interface | Steps 4–9 implemented: one store/observer, route guards, approved sign-in states, and shared profile/sign-out. Build, lint, strict typecheck, and 69 unit/component tests pass. Production JS: 126,209 bytes gzip. Emulator browser checks and preview verification pending. |
| 2026-10-19 | G1 plan and adapter | Plan and `firebase@13.0.0` approved. Initial pre-UI working-tree matched pair: 96,160 to 124,132 bytes gzip (+27,972), below 50,000. Later frozen-scaffold reproduction: 96,155 to 124,127 (+27,972), recorded in REVIEW.md/auth-adapter-bundle.json. `firebase.json` unchanged; remaining G1 work pending at this point. |
| 2026-10-19 | G0 merged | `gate-0-shell-speed` merged into `main` and G0 ticked. Final strict p95 < 100 ms runs: p95 55.9/62.8/67.7 ms, median about 44 ms, 0 requests, 1 of 60 transitions over 100 ms per run. Lighthouse mobile 93. |
| 2026-10-18 | G0 review follow-ups | 60 transitions per run; median/p95/max recorded; 15 superseded JSON files removed. Build, lint, typecheck, 10 unit/component and 5 browser tests pass. p95 82.6/75.6/73.2 ms; 0 requests; JS 96,155 bytes gzip; Lighthouse 99, LCP 1.857 s. G0 remains unchecked for the owner to tick after merge. |
| 2026-10-17 | G0 complete | Build, lint, strict typecheck, 10 unit/component and 5 browser tests pass. Final route p95 73.3/99.6/77.9 ms at 4x CPU; 0 requests. JS 96,155 bytes gzip. Lighthouse mobile 99, accessibility 100, LCP 1.856 s. Review and screenshot differences: `docs/qa/gate-0/REVIEW.md`. |
| 2026-10-17 | G0 tooling | Extended the existing Vite scaffold; strict TypeScript, approved test tools, local licensed fonts, SPA rewrite. Commit `1f2ceb8`. |
| 2026-10-17 | G0 shell, data, tests | Responsive shell, three in-memory views, 1,000 deterministic tasks, bounded Dashboard, accessible virtual lists. Ten unit/component tests and six browser checks passed; final audit and review pending. Commit `cd37a03`. |
| 2026-10-13 | A1, A2 | Plan v2 and calm warm designs approved |
| 2026-10-13 | A3, A4 | Workflow approved; starter pack delivered |
| 2026-10-13 | Design | Canvas finalized (20 frames); scope additions approved; milestone targets set |
| 2026-10-16 | A5 to A7 done | Repo, Firebase project, Vercel connected, domain authorized. Firestore emulator moved to 8081|
| 2026-10-17 | A8 done | ## Reports last visible heading, listed 8 skills g0-g6 and review, and AGENTS.md raw byte size is 4,260 bytes.
