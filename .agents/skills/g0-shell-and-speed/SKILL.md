---
name: g0-shell-and-speed
description: Use to build Gate 0 of Taskly: the app shell, design tokens, routes, fake data, and the automated speed test. Use before any Firebase code exists.
---

# Gate 0: Shell and speed

Goal: prove the app navigates fast before any backend exists.
Read: `docs/PLAN.md` sections 5, 6, 7, 10 (G0). Then `docs/DESIGN.md` and `docs/SCREENS.md` (Dashboard, Menu drawer, Quick Add button).
Do not: add Firebase, authentication, or real data. No file over 300 lines.

## Pages and features
- App shell: sidebar, topbar, phone top bar, bottom tab bar, menu drawer
- Floating Quick Add button (visible, not wired yet)
- Placeholder Dashboard, My Tasks, Project view rendering 1,000 fake tasks
- Components used by those: Button, IconButton, Chip, Pill, TaskRow (memoized), StatCard, Skeleton

## Targets (all must be met)
- Median and 95th percentile route-change time recorded; 95th percentile under 100 ms with CPU throttled 4x
- Zero network requests during navigation
- Initial JavaScript under 200 KB gzipped (record the baseline)
- Lighthouse mobile performance 90 or higher on the shell
Common to every gate: route change 95th percentile under 100 ms (1,000 tasks, CPU throttled 4x); lint, typecheck, unit and end-to-end tests pass; no console errors; no horizontal scroll at 390 and 1280 px; the `review` skill is run.

## Steps
1. Scaffold Vite, React, TypeScript (strict). Add React Router, Zustand, Vitest, React Testing Library, Playwright. Ask before adding anything else.
2. Create the folder structure from PLAN.md section 5.
3. Create `src/styles/tokens.css` and `global.css` from `docs/DESIGN.md`. Load Newsreader and Instrument Sans.
4. Build the shell: sidebar, topbar, main area. Under 820 px the sidebar becomes a bottom tab bar plus a drawer.
5. Routes: `/` (dashboard placeholder), `/tasks`, `/projects/:id`. Each renders from the store only.
6. Write a deterministic fake-data generator (`src/lib/fake-data.ts`): 3 projects and N tasks (N = 1000 for the speed test).
7. Store with selectors: tasks by project, overdue, today, upcoming. Pure functions with unit tests.
8. Memoized `TaskRow`. Unchanged rows must not re-render.
9. Speed test (Playwright): load 1000 fake tasks, click between the three views 20 times, measure click to next paint with CPU throttled 4x. Fail if the 95th percentile is 100 ms or more.
10. Test that navigation makes zero network requests.
11. Record the measured numbers in `docs/DECISIONS.md` under "Gate 0 measurements".

## Exit commands
`npm run lint && npm run typecheck && npm run test && npm run e2e`
All must pass. Report the median and 95th percentile route-change times.

## Report
Command results, numbers, what was not done, proposed `AGENTS.md` changes.

## Lessons
- 2026-10-17: Extend the existing scaffold and preserve package.json; Gate 0 does not need Firebase.
- 2026-10-17: Read row geometry once per render, reuse Intl formatters, and seed the virtualizer's initial rectangle to avoid an empty first range.
- 2026-10-17: Disable Playwright tracing for CPU-throttled speed tests; use two animation frames across the committed view's paint, not three.
- 2026-10-17: Native modal dialogs still need explicit Tab wrapping; test focus return, scrim dismissal, and every shell control's target size.
- 2026-10-17: Run Lighthouse through pinned npx with Playwright's CHROME_PATH; retain failed measurements and separate the informational unvirtualized benchmark.
