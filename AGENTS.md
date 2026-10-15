# AGENTS.md: Taskly

Fast, calm, real-time task manager. React + TypeScript + Vite + Firebase (Auth, Firestore), deployed on Vercel.
Source of truth: `docs/PLAN.md`. Do not read it whole. Read only the sections your skill names.
Screens: `docs/SCREENS.md` (per-screen behavior) and `docs/design/*.png`. Tokens: `docs/DESIGN.md`.

## Commands
`npm run dev | build | lint | typecheck | test | e2e | test:rules`
These are created in Gate 0 and later gates. If a command you need is missing, say so instead of guessing.

## Hard rules (always true)
1. Speed is a requirement. Budgets are in PLAN.md section 6. A change that breaks a budget is not done.
2. Route changes never touch the network and never clear data.
3. Firestore listeners start only in `src/lib/subscriptions`. Exactly three per session: projects, tasks, activity. Never in a component.
4. Data is flat under `users/{uid}`. No collection-group queries.
5. All state goes through the store (`src/store`). Components read through selectors. Business logic is pure functions in `src/lib`, with unit tests.
6. No file over 300 lines. Split by responsibility.
7. Styles use tokens from `src/styles/tokens.css` only. No hard-coded colors, sizes, or fonts. See `docs/DESIGN.md`.
8. TypeScript strict. No `any` without a comment saying why.
9. Accessibility is part of done: keyboard use, visible focus, AA contrast, 44 px touch targets, reduced motion.
10. Never commit secrets. Firebase config comes from `VITE_FIREBASE_*` variables. `.env` is git-ignored.
11. Never invent requirements. If the plan is unclear or silent, ask.
12. Add no dependency without asking, and say why.
13. Scope: build only what `docs/PLAN.md` sections 3 and 4 and `docs/SCREENS.md` describe. Anything else is proposed in your report, never added.

## Workflow (every session)
1. One gate per session. The owner names a skill. Read it, then read only the plan sections it lists.
2. Propose a plan first: files to touch, steps, risks. Wait for approval before coding.
3. Work on a branch named `gate-N-short-name`. Small commits with imperative messages (`feat:`, `fix:`, `test:`).
4. Build the slice end to end: interface, store, data, tests.
5. Run the skill's exit commands. Fix failures. Never report done with a failing check.
6. Run the `review` skill. Report: what changed, command results with numbers, what you did not do, open questions.
7. Do not edit `AGENTS.md` or `docs/PLAN.md` yourself. Propose changes in your report and the owner decides.
   You may append up to five dated lessons to the "Lessons" section of the skill you used.
8. If a fix fails twice, stop and report what you tried. Do not loop.

## Context discipline
- Search before reading. Read only the files and line ranges you need.
- Do not paste long command output. Summarize it and quote only the failing lines.
- Do not restate documents back to the owner. Link or name the section.

## Skills (`.agents/skills/`)
Use when the owner names one, or when the task clearly matches its description.
- `g0-shell-and-speed`: app shell, tokens, routes, fake data, speed test. Start here.
- `g1-auth`: Google sign-in and protected routes.
- `g2-store-and-sync`: store, Firestore listeners, security rules.
- `g3-projects-tasks`: project and task CRUD, forms, confirmations.
- `g4-dashboard`: stats, Overdue, Today, Upcoming, activity.
- `g5-search-alerts`: search, filters, states, in-app alerts.
- `g6-qa-and-deploy`: accessibility, responsive, performance, release.
- `review`: run at the end of every gate.
Skills marked `Status: outline` must be expanded and approved by the owner before use.

## Repository map
`src/app` routes and shell, `src/features/*` one folder per feature, `src/lib` pure logic and Firebase,
`src/store` store and selectors, `src/ui` shared components, `src/styles` tokens, `tests/`, `docs/`.
Detail: PLAN.md section 5.

## Definition of done
Exit commands pass. No console errors. Works at 390 px and 1280 px wide. The `review` skill was run.

## Reports
Short. Use lists. State facts and numbers (timings, counts). Say plainly what is not done.
