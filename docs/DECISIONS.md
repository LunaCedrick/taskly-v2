# DECISIONS.md

A decision may change when a measurement says so. Write the change here first.

| Date | Decision | Why | Revisit if |
|---|---|---|---|
| 2026-10-13 | React + TypeScript + Vite | Recognized stack, type safety, fast tooling | Bundle budget is missed with no fix |
| 2026-10-13 | Firebase Auth + Firestore (modular SDK) | Free tier, real-time, owner-only rules | Quotas block use |
| 2026-10-13 | Flat `users/{uid}/tasks`, one listener | No indexes, simple rules, fast views | Task counts outgrow memory |
| 2026-10-13 | Single store, listeners started once | Fixes v1 navigation lag | Gate 0 or Gate 2 tests fail |
| 2026-10-13 | Zustand | Small, selector-based | Measurements say otherwise |
| 2026-10-13 | In-app alerts first | Push needs a paid backend | Owner decides to pay |
| 2026-10-13 | Codex builds, `AGENTS.md` plus one skill per gate | Small context, focused sessions | Rules exceed 8 KB or skills drift |
| 2026-10-13 | Scope additions: optional due time, automatic project colors, sort, category suggestions, project filter in My Tasks only | Smoother task management at low cost; see PLAN.md scope additions table | Cost grows beyond a small selector or field |
| 2026-10-13 | Due-time rule: no time means due at end of that day | One consistent rule for overdue and alerts | Owner changes the rule |
| 2026-10-13 | Native date and time inputs in v0.1, custom calendar later | Accessible and cheap; the calendar popover is costly | Native inputs fail owner review |
| 2026-10-13 | No Undo in v0.1 | Deletes already ask for confirmation; Undo adds restore logic | Owner asks for it |
| 2026-10-13 | Quick Add is a floating button on every screen | Always reachable, matches phone | Overlaps content in testing |

## Gate 0 measurements
(filled in during Gate 0: median and 95th percentile route-change time, bundle size)
