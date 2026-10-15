---
name: g2-store-and-sync
description: "Use to build Gate 2 of Taskly: the store, the three Firestore listeners, writes, and security rules."
---
# Gate 2: Store and sync

Status: outline. Before using it, expand it into a full skill (same layout as `g0-shell-and-speed`) and ask the owner to approve it.

Read: PLAN.md sections 5, 6, 10 (G2), 13; SCREENS.md (States)
Do not: change the rules in `AGENTS.md`; add anything outside the pages below; touch files outside this gate's feature folders without saying why.

## Pages and features
- Dashboard, My Tasks, Project view now read real data (read-only)
- States: loading skeleton, first run, empty project, load error

## Targets (all must be met)
- Exactly 3 Firestore listeners during navigation (automated test)
- A burst of 100 snapshot updates causes at most 1 render per frame
- 1,000 seeded tasks in the emulator still meet the route-change budget
- Rules tests: another user cannot read or write; invalid fields rejected
- No collection-group queries (search check)
Common to every gate: route change 95th percentile under 100 ms (1,000 tasks, CPU throttled 4x); lint, typecheck, unit and end-to-end tests pass; no console errors; no horizontal scroll at 390 and 1280 px; the `review` skill is run.

## Exit commands
`npm run lint && npm run typecheck && npm run test && npm run e2e` plus the targets above that are automated. Record manual checks in the report.

## Report
Command results with numbers, each target met or not, what was not done, proposed `AGENTS.md` changes.

## Lessons
(none yet)
