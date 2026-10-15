# TASKLY v2: PLAN.md

Status: APPROVED on 2026-10-13. Owner: Cedrick Luna.
Replaces: PLAN.md v1 (archived under `docs/archive/PLAN-v1.md`).

Do not read this file whole in every session. Skills name the sections they need. It is the source of truth for
requirements. Architecture and tooling decisions are listed in the Decision Log (section 14)
with a "revisit if" condition. A decision may change when a measurement says so, and the change
must be written in the log first.

---

## 1. Why v2 exists

v1 had good requirements and a design that made the app slow: tab switches lagged and some clicks
did nothing. The lessons, which drive this plan:

1. Navigation must never wait for the network. Data is loaded once into memory and views read from it.
2. Listeners are started once, in one place, and never grow with navigation.
3. Rendering must be incremental and visible-only. One data change must not rebuild the whole page.
4. Speed is a requirement with numbers (section 6), tested from the first milestone, not a final polish step.
5. Scope is released in slices. Each slice works end to end before the next begins.

## 2. Product

**Taskly** is a fast, calm, real-time task manager for one person across many projects.
Dashboard-first: the app answers "What needs my attention today?" without opening a project.

Users: university students, solo developers, professionals. Also reviewed as a portfolio piece,
so it must hold up to technical scrutiny.

Not: a team tool, an enterprise suite, or a tutorial CRUD demo.

## 3. Releases and scope

### v0.1 (this build)
- Google sign-in (Firebase Auth), sign-out, protected routes
- Projects: create, rename, delete (with confirmation), progress
- Tasks: create, edit, complete, delete (with confirmation). Fields: title (required), description, due date, priority (high, medium, low, none), category, status (todo, in progress, done)
- Dashboard: stats, Overdue, Today, Upcoming, Recent activity, all from every project
- Search (title, description, category) and filters (status, priority, category)
- In-app alerts: banner for overdue and due-today tasks, bell with count and a panel
- Loading skeletons, empty states, clear error messages, confirmation modals
- Quick Add: a floating button on every screen opens a one-field popover (desktop) or sheet (phone) with optional Due, Project, and Priority chips and a path to the full form
- Sort (due date, priority, newest) in the project view and My Tasks; optional due time; category suggestions from existing tasks; project colors assigned automatically
- Responsive: desktop and phone
- Deployed on Vercel with a preview URL per branch

### v0.2
- Offline use with automatic sync (Firestore local cache)
- Settings page (profile, notification preferences, account)
- Installable web app (PWA)

### v0.3
- Push notifications. Scheduled or server-sent push needs a backend and a paid plan, which is
  out of scope for now. Revisit only if the owner decides to pay for it. Until then, alerts
  fire only while the app is open (in-app plus the browser Notification API, if permitted).

### Non-goals
Teams and sharing, task assignment, email or SMS, AI features, recurring tasks, calendar view,
drag-and-drop ordering, dark mode (later), scheduled push, Undo, swipe actions on phone, a custom calendar
popover (v0.1 uses quick chips plus native date and time inputs), natural-language date parsing, an offline banner (v0.2).

### Approved scope additions (owner approved 2026-10-13)
| Addition | Why it is acceptable | Cost |
|---|---|---|
| Optional due time | Fits the once-a-minute alert check. No time means due at the end of that day; a time means due at that time. | One stored boolean, one rule in selectors |
| Project colors, automatic | The colored dots are in every approved design. Not editable in v0.1. | One stored number per project |
| Sort (due date, priority, newest) | The designs showed a fixed order with no control. Sorting is in memory. | One selector option |
| Category suggestions | Derived from tasks already in memory. | No new data |
| Project filter in My Tasks only | Natural across projects. Not in the project view or dashboard. | One filter in the same pass |

Anything else that is not in sections 3 and 4 or in `docs/SCREENS.md` is proposed in a report and recorded in
`docs/DECISIONS.md` before it is built.

## 4. Feature acceptance criteria (v0.1)

| Feature | Done when |
|---|---|
| Auth | A new user signs in with Google and lands on the dashboard. Popup blocked and network errors show clear messages. Refresh keeps the session. |
| Projects | Create, rename, delete. Duplicate and empty names are rejected. Deleting a project deletes its tasks after confirmation, in batches. |
| Tasks | Full CRUD with validation. Changes appear on a second open device without refresh. Overdue tasks are tinted, today's tasks are marked. |
| Dashboard | Stats and the three sections cover all projects. Switching to it makes no network request. |
| Search and filters | Combined search plus status, priority, category in one pass over in-memory data, debounced input. |
| Alerts | The overdue banner and bell count match the data. Dismissing persists for the session. |
| Quick Add | From any screen, open, type a title, press Enter. The task appears at once, the field clears and stays focused. "More options" opens the full form with the title kept. |
| Sort and due time | Sort options work in memory. The due-time rule in the scope additions table is applied in every selector. |
| States | Skeletons while loading, helpful empty states, errors never silent. |
| Accessibility | Keyboard operable, visible focus, WCAG AA contrast, 44 px touch targets, reduced-motion respected. |

## 5. Architecture

### Stack
- React (current stable) with TypeScript in strict mode
- Vite (build and dev server)
- Firebase modular SDK: Authentication and Cloud Firestore (free Spark plan)
- React Router for routes
- Zustand for the single client store (proposed; keep if it passes the performance gates)
- CSS variables for design tokens plus CSS Modules (no UI framework)
- Vitest and React Testing Library, Playwright, and the Firebase Emulator Suite

### Data model (flat, per user)
```
users/{uid}                     profile: displayName, photoURL, createdAt
users/{uid}/projects/{id}       name, colorIndex, createdAt, updatedAt
users/{uid}/tasks/{id}          projectId, title, description, dueDate | null, dueHasTime, priority,
                                category, status, createdAt, updatedAt, completedAt | null
users/{uid}/activity/{id}       type, taskId, projectId, text, createdAt   (latest 20 shown)
```
Why flat: one listener returns all of a user's tasks. There are no collection-group queries, no
extra indexes, and no per-project listeners. Project views, progress, and the dashboard are
computed from memory. (v1 used a collection-group query that needed an index and special rules.)

### Data flow
```
Firestore listener (once, after sign-in) -> store (batched per frame) -> selectors -> components
User action -> Firestore write (optimistic via local cache) -> listener updates the store
```
- Exactly three listeners for the signed-in session: projects, tasks, activity (limit 20).
  They live in one module (`lib/subscriptions`) with start and stop, and a test asserts the count never changes during navigation.
- Apply `docChanges()` to the store incrementally. Ignore snapshots that change nothing.
- Batch store updates so several snapshots in one frame cause one render.
- Components subscribe to narrow selectors. Rows are memoized. If a list can exceed about 200 rows, virtualize it.
- Navigation is a route change only: no fetching, no clearing of data, no skeleton for data already in the store.
- One delegated event approach for lists (handlers by `data-` attributes or stable callbacks), never handlers recreated per render.

### Security rules
Owner-only: `match /users/{uid}/{document=**} { allow read, write: if request.auth.uid == uid; }`
plus field validation on create and update. Rules are unit-tested with the emulator.

### Folder structure
```
src/
  app/            routes, providers, shell layout
  features/       auth, projects, tasks, dashboard, alerts
  lib/            firebase, subscriptions, dates
  store/          store, selectors
  ui/             shared components (Button, Modal, Skeleton, EmptyState)
  styles/         tokens.css, global.css
tests/            unit, component, e2e, rules
docs/             PLAN.md, decisions, archive/
```
Rules: no file over about 300 lines. No feature imports another feature's internals. Business
logic (dates, filtering, grouping) lives in pure, tested functions.

## 6. Performance budget (tested, not hoped for)

| Metric | Target |
|---|---|
| Route change (click to next paint), 1,000 tasks, throttled CPU 4x | under 100 ms |
| Interaction to Next Paint (p75) | 200 ms or better |
| Largest Contentful Paint, mid phone, 4G | under 2.5 s |
| Initial JavaScript (gzip) | under 200 KB (measure, then adjust) |
| Active Firestore listeners during navigation | constant (3) |
| Renders per snapshot | at most 1 per frame |
| Lighthouse mobile performance | 90 or higher |

Gate 0 builds the speed test before any Firebase code: fake data (1,000 tasks), three views, a
Playwright test that clicks between them and fails if the target is missed.

## 7. Design: calm warm

Mockups: `Taskly v2 | Calm warm designs` canvas (dashboard, project view, phone): https://claude.ai/artifact/PP55jo2pbr3tPSzjh16dSB. Tokens and component rules: `docs/DESIGN.md`.

- Palette: cream `#FAF9F5`, sand `#F3F1EA`, lines `#E6E2D6`, ink `#2B2924`, muted `#6F6B60`,
  clay accent `#B5522F`, status colors: overdue brick `#A63A2A` on `#F3DAD3`, today amber
  `#8A5A0B` on `#F6E7C8`, done sage `#4F6339` on `#E3E9D8`.
- Type: Newsreader for headings and numbers, Instrument Sans for the interface.
- Shape: 10 to 14 px radii, thin borders, no heavy shadows, gentle motion (opacity and transform only).
- Information is never color-only: overdue, today, priority, and status also have text labels.
- Text contrast at least 4.5:1. Touch targets at least 44 px. Respect `prefers-reduced-motion`.

## 8. Notifications

v0.1: derived locally from the store (due date versus now), re-evaluated on load, on window focus,
and every minute while open. Banner plus bell panel. No server.
v0.3: see section 3.

## 9. Workflow with Codex

1. `AGENTS.md` (8 KB or less) holds the always-true rules and the workflow. It is loaded every session.
2. One skill per gate in `.agents/skills/`. A skill is loaded only when it is used, and it names the plan sections to read.
3. Each gate: new session, plan first, branch, build the slice end to end, run the exit commands, run the `review` skill, pull request.
4. Claude reviews each pull request in chat before merge. Codex builds.
5. Rule changes are proposed by the agent and approved by the owner. Skills collect up to five short lessons per gate.
6. Small commits, conventional messages. Never commit secrets (Firebase web config goes in `.env`).

## 10. Milestone gates

Common to every gate: route change 95th percentile under 100 ms (1,000 tasks, CPU throttled 4x); lint, typecheck, unit and end-to-end tests pass; no console errors; no horizontal scroll at 390 and 1280 px; the `review` skill is run.

Each gate builds the pages listed, meets every target, and ends with the exit commands passing.
Progress is tracked in `docs/TRACKER.md`.

### G0: Shell and speed
Pages:
- App shell: sidebar, topbar, phone top bar, bottom tab bar, menu drawer
- Floating Quick Add button (visible, not wired yet)
- Placeholder Dashboard, My Tasks, Project view rendering 1,000 fake tasks
- Components used by those: Button, IconButton, Chip, Pill, TaskRow (memoized), StatCard, Skeleton
Targets:
- Median and 95th percentile route-change time recorded; 95th percentile under 100 ms with CPU throttled 4x
- Zero network requests during navigation
- Initial JavaScript under 200 KB gzipped (record the baseline)
- Lighthouse mobile performance 90 or higher on the shell
Demo: Click between three screens on 1,000 fake tasks and it feels instant.

### G1: Authentication
Pages:
- Sign in (desktop, phone stacked)
- Session check screen (app start)
- Sign-in error state (popup blocked, network, cancelled)
- User menu: avatar and Sign out in the sidebar and drawer
- Protected routes
Targets:
- Signed-out visit goes to /sign-in, then returns to the requested route after sign-in
- A page refresh keeps the session
- All three sign-in errors show the designed message
- Sign in to dashboard shell under 3 s on the preview over throttled 4G (record it)
Demo: Sign in with Google on the Vercel preview, refresh, sign out.

### G2: Store and sync
Pages:
- Dashboard, My Tasks, Project view now read real data (read-only)
- States: loading skeleton, first run, empty project, load error
Targets:
- Exactly 3 Firestore listeners during navigation (automated test)
- A burst of 100 snapshot updates causes at most 1 render per frame
- 1,000 seeded tasks in the emulator still meet the route-change budget
- Rules tests: another user cannot read or write; invalid fields rejected
- No collection-group queries (search check)
Demo: Real data appears on all three screens and navigation stays instant.

### G3: Projects, tasks, Quick Add
Pages:
- Task form: modal on desktop, bottom sheet on phone, add and edit
- Dialogs: new project, rename project, delete task, delete project
- Quick Add: floating button live, popover on desktop, sheet on phone, "More options" opens the full form
- Pickers: quick chips (Today, Tomorrow, Next week, No date) plus native date and time inputs, project select, category suggestions
- Toasts: Added, Deleted, Save failed (no Undo)
- Project view: progress bar, row actions, "Add a task" row
Targets:
- Quick Add takes at most 3 steps: open, type, Enter
- The new task appears under 100 ms after Enter (optimistic)
- A change shows on a second device within 1 s (manual check, recorded)
- Title required; duplicate and empty project names rejected; deletes ask for confirmation
- Project delete removes its tasks in batches of at most 500
- Activity entries are written for add, complete, move, delete
- Due-time rule: no time means due at the end of that day; a time means due at that time
Demo: Create, edit, complete, and delete tasks and projects, fast, from any screen.

### G4: Dashboard
Pages:
- Dashboard (desktop and phone): stat cards, Overdue, Today, Upcoming, Recent activity
- Complete a task in place
Targets:
- Selectors unit-tested, including end of day, a set time, time zones, and empty data
- The dashboard is derived from memory, with zero requests on navigation
- Completing a task updates every section within one frame
- Interaction to Next Paint 200 ms or better with 1,000 tasks
Demo: The dashboard answers "what needs my attention today?" at a glance.

### G5: Search, filters, sort, alerts
Pages:
- My Tasks with search, filters, sort, and removable filter chips
- Project view filters and sort
- Phone: search bar and filter sheet
- Alerts: overdue banner, bell count, alerts panel, "all caught up"
- No-results state
Targets:
- Search plus filter plus sort over 1,000 tasks completes in under 50 ms (measured in a test); typing stays responsive
- Filters combine correctly (unit tests); the project filter exists only in My Tasks
- Alert counts equal the selector output on fixture data
- The once-a-minute alert check causes no render unless the counts change
- Banner dismissal persists for the session
Demo: Find any task in seconds, and see what is overdue without hunting.

### G6: QA and deploy
Pages:
- Project not found
- Final polish across every page against the canvas
- README
Targets:
- Lighthouse mobile: performance 90 or higher, accessibility 95 or higher, no critical axe violations
- Keyboard-only walkthrough of every page passes
- Screenshots at 390, 768, and 1280 px reviewed against the canvas
- Largest Contentful Paint under 2.5 s on a mid phone over 4G
- Production variables, Firebase authorized domains, and security rules deployed
Demo: The production site is live and holds up under review.

## 11. Testing

Unit tests (Vitest) for dates, grouping, filtering, selectors. Component tests for forms and
modals. Playwright for flows and the speed gate. Rules tests with the Firebase Emulator Suite.
Manual passes for accessibility and phone layouts.

## 12. Deployment

Vercel connected to the new GitHub repository. `VITE_FIREBASE_*` variables set in Vercel for
Production and Preview. Add the Vercel domains to Firebase Auth authorized domains. Every
branch gets a preview URL.

## 13. Risks and open questions

| Risk | Mitigation |
|---|---|
| Free-plan Firestore read quota with one listener over all tasks | Keep done-task history bounded (archive older than 30 days in v0.2). Check current quotas in the Firebase console. |
| Optimistic UI and duplicate snapshots cause flicker | Compare versions before applying. Cover with tests. |
| Push is unavailable without a backend | Documented in section 3. In-app alerts first. |
| Scope growth | Slices and gates. New ideas go to the v0.2 and v0.3 lists. |

Open: confirm Zustand versus plain React context after Gate 0 measurements.

## 14. Decision Log

| Decision | Why | Revisit if |
|---|---|---|
| React + TypeScript + Vite | Recognized stack, type safety against wiring bugs, fast tooling | Bundle budget is missed with no fix |
| Firebase Auth + Firestore (modular) | Free tier, real-time, owner-only rules | Quotas become a blocker |
| Flat `users/{uid}/tasks` | One listener, no indexes, simple rules | Per-user task counts exceed what memory handles |
| Single store, listeners started once | Fixes v1's navigation lag | Gate 0 or G2 tests fail |
| Zustand | Small, selector-based, no providers | Gate measurements say otherwise |
| In-app alerts first | Push needs a paid backend | Owner decides to pay |
| Codex builds with `AGENTS.md` and one skill per gate | Small always-loaded context, focused sessions, tests as proof | Rules exceed 8 KB or skills drift |
| New repository, Vercel | Clean history, preview per branch | n/a |
