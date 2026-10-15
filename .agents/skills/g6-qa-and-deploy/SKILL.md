---
name: g6-qa-and-deploy
description: "Use to build Gate 6 of Taskly: accessibility, responsive checks, performance tuning, and the production release."
---
# Gate 6: QA and deploy

Status: outline. Before using it, expand it into a full skill (same layout as `g0-shell-and-speed`) and ask the owner to approve it.

Read: PLAN.md sections 6, 10 (G6), 11, 12; SCREENS.md (all)
Do not: change the rules in `AGENTS.md`; add anything outside the pages below; touch files outside this gate's feature folders without saying why.

## Pages and features
- Project not found
- Final polish across every page against the canvas
- README

## Targets (all must be met)
- Lighthouse mobile: performance 90 or higher, accessibility 95 or higher, no critical axe violations
- Keyboard-only walkthrough of every page passes
- Screenshots at 390, 768, and 1280 px reviewed against the canvas
- Largest Contentful Paint under 2.5 s on a mid phone over 4G
- Production variables, Firebase authorized domains, and security rules deployed
Common to every gate: route change 95th percentile under 100 ms (1,000 tasks, CPU throttled 4x); lint, typecheck, unit and end-to-end tests pass; no console errors; no horizontal scroll at 390 and 1280 px; the `review` skill is run.

## Exit commands
`npm run lint && npm run typecheck && npm run test && npm run e2e` plus the targets above that are automated. Record manual checks in the report.

## Report
Command results with numbers, each target met or not, what was not done, proposed `AGENTS.md` changes.

## Lessons
(none yet)
