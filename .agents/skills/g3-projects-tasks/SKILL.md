---
name: g3-projects-tasks
description: Use to build Gate 3 of Taskly: project and task create, edit, delete, forms, Quick Add, pickers, dialogs, and toasts.
---
# Gate 3: Projects, tasks, Quick Add

Status: outline. Before using it, expand it into a full skill (same layout as `g0-shell-and-speed`) and ask the owner to approve it.

Read: PLAN.md sections 4, 10 (G3); DESIGN.md; SCREENS.md (Project view, Task form, Dialogs, Quick Add, Toasts)
Do not: change the rules in `AGENTS.md`; add anything outside the pages below; touch files outside this gate's feature folders without saying why.

## Pages and features
- Task form: modal on desktop, bottom sheet on phone, add and edit
- Dialogs: new project, rename project, delete task, delete project
- Quick Add: floating button live, popover on desktop, sheet on phone, "More options" opens the full form
- Pickers: quick chips (Today, Tomorrow, Next week, No date) plus native date and time inputs, project select, category suggestions
- Toasts: Added, Deleted, Save failed (no Undo)
- Project view: progress bar, row actions, "Add a task" row

## Targets (all must be met)
- Quick Add takes at most 3 steps: open, type, Enter
- The new task appears under 100 ms after Enter (optimistic)
- A change shows on a second device within 1 s (manual check, recorded)
- Title required; duplicate and empty project names rejected; deletes ask for confirmation
- Project delete removes its tasks in batches of at most 500
- Activity entries are written for add, complete, move, delete
- Due-time rule: no time means due at the end of that day; a time means due at that time
Common to every gate: route change 95th percentile under 100 ms (1,000 tasks, CPU throttled 4x); lint, typecheck, unit and end-to-end tests pass; no console errors; no horizontal scroll at 390 and 1280 px; the `review` skill is run.

## Exit commands
`npm run lint && npm run typecheck && npm run test && npm run e2e` plus the targets above that are automated. Record manual checks in the report.

## Report
Command results with numbers, each target met or not, what was not done, proposed `AGENTS.md` changes.

## Lessons
(none yet)
