# TASKLY v2: TRACKER.md

Where we are: Phase B, Gate 0. Update this file after every step (tick the box, add a log line).
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
| G0 Shell and speed | App shell: sidebar, topbar, phone top bar, bottom tab bar, menu drawer; Floating Quick Add button (visible, not wired yet); Placeholder Dashboard, My Tasks, Project view rendering 1,000 fake tasks; ... | Median and 95th percentile route-change time recorded; 95th percentile under 100 ms with CPU throttled 4x; Zero network requests during navigation; ... | [ ] |
| G1 Authentication | Sign in (desktop, phone stacked); Session check screen (app start); Sign-in error state (popup blocked, network, cancelled); ... | Signed-out visit goes to /sign-in, then returns to the requested route after sign-in; A page refresh keeps the session; ... | [ ] |
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
| 2026-10-13 | A1, A2 | Plan v2 and calm warm designs approved |
| 2026-10-13 | A3, A4 | Workflow approved; starter pack delivered |
| 2026-10-13 | Design | Canvas finalized (20 frames); scope additions approved; milestone targets set |
| 2026-10-16 | A5 to A7 done | Repo, Firebase project, Vercel connected, domain authorized. Firestore emulator moved to 8081|
| 2026-10-17 | A8 done | ## Reports last visible heading, listed 8 skills g0-g6 and review, and AGENTS.md raw byte size is 4,260 bytes.