---
name: g5-search-alerts
description: Use to build Gate 5 of Taskly: search, filters, sort, alerts, and the remaining states.
---
# Gate 5: Search, filters, sort, alerts

Status: outline. Before using it, expand it into a full skill (same layout as `g0-shell-and-speed`) and ask the owner to approve it.

Read: PLAN.md sections 4, 8, 10 (G5); SCREENS.md (My Tasks, Alerts panel, States)
Do not: change the rules in `AGENTS.md`; add anything outside the pages below; touch files outside this gate's feature folders without saying why.

## Pages and features
- My Tasks with search, filters, sort, and removable filter chips
- Project view filters and sort
- Phone: search bar and filter sheet
- Alerts: overdue banner, bell count, alerts panel, "all caught up"
- No-results state

## Targets (all must be met)
- Search plus filter plus sort over 1,000 tasks completes in under 50 ms (measured in a test); typing stays responsive
- Filters combine correctly (unit tests); the project filter exists only in My Tasks
- Alert counts equal the selector output on fixture data
- The once-a-minute alert check causes no render unless the counts change
- Banner dismissal persists for the session
Common to every gate: route change 95th percentile under 100 ms (1,000 tasks, CPU throttled 4x); lint, typecheck, unit and end-to-end tests pass; no console errors; no horizontal scroll at 390 and 1280 px; the `review` skill is run.

## Exit commands
`npm run lint && npm run typecheck && npm run test && npm run e2e` plus the targets above that are automated. Record manual checks in the report.

## Report
Command results with numbers, each target met or not, what was not done, proposed `AGENTS.md` changes.

## Lessons
(none yet)
