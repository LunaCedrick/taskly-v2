---
name: g4-dashboard
description: Use to build Gate 4 of Taskly: the dashboard with stats, Overdue, Today, Upcoming, and recent activity.
---
# Gate 4: Dashboard

Status: outline. Before using it, expand it into a full skill (same layout as `g0-shell-and-speed`) and ask the owner to approve it.

Read: PLAN.md sections 4, 10 (G4); SCREENS.md (Dashboard, Formatting rules)
Do not: change the rules in `AGENTS.md`; add anything outside the pages below; touch files outside this gate's feature folders without saying why.

## Pages and features
- Dashboard (desktop and phone): stat cards, Overdue, Today, Upcoming, Recent activity
- Complete a task in place

## Targets (all must be met)
- Selectors unit-tested, including end of day, a set time, time zones, and empty data
- The dashboard is derived from memory, with zero requests on navigation
- Completing a task updates every section within one frame
- Interaction to Next Paint 200 ms or better with 1,000 tasks
Common to every gate: route change 95th percentile under 100 ms (1,000 tasks, CPU throttled 4x); lint, typecheck, unit and end-to-end tests pass; no console errors; no horizontal scroll at 390 and 1280 px; the `review` skill is run.

## Exit commands
`npm run lint && npm run typecheck && npm run test && npm run e2e` plus the targets above that are automated. Record manual checks in the report.

## Report
Command results with numbers, each target met or not, what was not done, proposed `AGENTS.md` changes.

## Lessons
(none yet)
