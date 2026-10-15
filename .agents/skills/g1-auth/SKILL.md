---
name: g1-auth
description: Use to build Gate 1 of Taskly: Google sign-in, protected routes, the session check, and the sign-in error states.
---
# Gate 1: Authentication

Status: outline. Before using it, expand it into a full skill (same layout as `g0-shell-and-speed`) and ask the owner to approve it.

Read: PLAN.md sections 3, 4 (Auth), 10 (G1); SCREENS.md (Sign in, States)
Do not: change the rules in `AGENTS.md`; add anything outside the pages below; touch files outside this gate's feature folders without saying why.

## Pages and features
- Sign in (desktop, phone stacked)
- Session check screen (app start)
- Sign-in error state (popup blocked, network, cancelled)
- User menu: avatar and Sign out in the sidebar and drawer
- Protected routes

## Targets (all must be met)
- Signed-out visit goes to /sign-in, then returns to the requested route after sign-in
- A page refresh keeps the session
- All three sign-in errors show the designed message
- Sign in to dashboard shell under 3 s on the preview over throttled 4G (record it)
Common to every gate: route change 95th percentile under 100 ms (1,000 tasks, CPU throttled 4x); lint, typecheck, unit and end-to-end tests pass; no console errors; no horizontal scroll at 390 and 1280 px; the `review` skill is run.

## Exit commands
`npm run lint && npm run typecheck && npm run test && npm run e2e` plus the targets above that are automated. Record manual checks in the report.

## Report
Command results with numbers, each target met or not, what was not done, proposed `AGENTS.md` changes.

## Lessons
(none yet)
