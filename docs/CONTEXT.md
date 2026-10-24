# Taskly v2: project context (handoff)

Last updated: 2026-10-24. If anything here conflicts with the repo (`docs/TRACKER.md`, `docs/DECISIONS.md`, `docs/PLAN.md`, `AGENTS.md`), the repo wins. Update this file at the end of each gate.

## 1. What this is and who does what
- Taskly v2 is a ground-up rebuild of a personal task manager, designed so route changes are instant and never touch the network.
- Repo: https://github.com/LunaCedrick/taskly-v2. Hosting: Vercel (Production from `main`, Preview per branch). Firebase: Google Auth and Firestore (Spark plan).
- Roles: Codex builds each gate. Claude plans, designs and reviews. The owner (Ced) decides, tests in the browser, merges and, in practice, approves each tracker tick. Claude Code reviews read-only; it never commits to a gate branch.

## 2. Where things are
- `AGENTS.md`: Codex's rules (read by Codex). `CLAUDE.md`: Claude Code's rules (imports `AGENTS.md`).
- `docs/`: `PLAN.md` (scope, gates, targets), `SCREENS.md`, `DESIGN.md`, `DECISIONS.md` (measurements and decisions), `TRACKER.md`, `PROMPTS.md`, `SETUP.md`, `design/*.png`, `qa/gate-N/` (evidence, `REVIEW.md`).
- `docs/qa/gate-2/`: G2 evidence, `REVIEW.md`, owner verification in `ROLLOUT.md`, and the five approved PLAN wordings in `PROPOSED-PLAN-CHANGES.md` (now applied).
- `.agents/skills/`: one skill per gate (`g0-shell-and-speed`, `g1-auth`, `g2-store-and-sync` are full; later gates are outlines until expanded and approved) plus `review`. These are Codex's folder; read them by path.
- Stack: React 19, TypeScript strict, Vite, React Router, Zustand, TanStack Virtual, CSS variables and CSS Modules, Firebase modular SDK (`firebase@13.0.0`, exact pin), Vitest, Testing Library, Playwright, Firebase Emulator Suite.

## 3. Status
| Gate | What | Status |
|---|---|---|
| G0 | Shell and speed | Merged |
| G1 | Google auth, protected routes | Merged (PR #1, plain merge commit) |
| G2 | Store, sync, security rules | Merged (PR #5, plain merge commit 0374036) |
| G3 | Projects, tasks, Quick Add | Next: skill must be expanded and approved first |
| G4 | Dashboard | Outline |
| G5 | Search, filters, sort, alerts | Outline |
| G6 | QA and deploy | Outline |
| R1/R2/R3 | Production check, update portfolio Taskly scene, retrospective | After G6 |

Production check covering G1 (VERIFIED by owner, 2026-10-24): [x] Production build of `main` Ready, [x] production sign-in works, [x] `/tasks` deep link does not 404. Covered by the same G2 Production check.

G2 Production check (VERIFIED by owner, 2026-10-24): sign-in worked; first-run state with no load error; `/tasks` loaded directly (no 404); zero console errors. See `docs/qa/gate-2/ROLLOUT.md`.

## 4. Global targets (every gate)
- Route-change p95 under 100 ms (strict; 1,000 tasks, CPU throttled 4x), zero navigation requests.
- Initial JavaScript under 200,000 B gzip. G1 ended at 126,224 B (Auth added 27,972 B).
- Lighthouse mobile at least 90, LCP under 2.5 s, no horizontal scroll at 390 and 1280 px.
- lint, typecheck, unit and browser tests pass, no app console errors, `review` skill run.
- G1 results: route p95 under 100 ms in all runs (final 59.2 / 58.7 / 59.8 ms); 75 unit/component tests, 24 browser tests. Owner-measured real-Google sign-in, popup close to Dashboard: 198.1 / 43.4 / 101.1 ms, median 101.1 ms.
- G2 results (confirmed against `docs/qa/gate-2/REVIEW.md`, including its rollout-fix checks): 196 unit tests, 116 rules tests, 31 browser tests; initial JS 127,820 B gzip, deferred 137,162 B, total 264,982 B. Firestore remains outside the initial static/modulepreload graph.
- G2 route p95 under 100 ms in final verification runs: 68.6 / 74.7 / 68.2 ms, zero navigation requests and three listeners unchanged. Of 18 retained G2 runs, 17 passed and one failed at 104.8 ms; likely main-thread jitter, cause UNPROVEN. Owner accepted this record for merge; all samples remain retained.
- G2 first data paint on the seeded emulator: 8.035 s at Slow 4G / 4x CPU. The emulator stream was uncompressed; this is a measurement, not a Production prediction. Production first-data latency remains UNVERIFIED.

## 5. Working rules
- One gate per session. Plan first, wait for approval, then build. Branch per gate (`gate-N-...`), small imperative commits, exit commands pass, `review` skill, read-only Claude Code review, then a PR that the owner merges with a plain merge commit (not squash; evidence files cite commit hashes).
- Only Codex commits and pushes to a gate branch. Claude Code uses its own worktree (`../taskly-v2-review`, plus a detached worktree to run a gate's commands).
- Gate skills are expanded one at a time, from `main`, after the previous gate has merged. The expand prompt is in `docs/PROMPTS.md`.
- Rule changes (to `AGENTS.md`, `docs/PLAN.md`) are proposed, never applied. Scope discipline: build only what `PLAN.md` sections 3 and 4 and `SCREENS.md` describe; extras are proposed and logged first. Up to five dated lessons per skill.
- Attribute a decision to the owner only if the owner actually made it. A threshold is applied exactly as written (p95 strictly under 100 ms).

## 6. Hard constraints
- Port 8080 is used by an unrelated service on the owner's machine. Never stop or reconfigure it. Emulator ports: Auth 9099, Firestore 8081 (the `emulators` block in `firebase.json` stays as it is).
- Never commit `.env` or real secrets. `VITE_FIREBASE_*` are set in Vercel for Preview and Production; the emulator flag is never set there.
- No `Cross-Origin-Opener-Policy` header (it breaks the Google popup).
- Never deploy test-mode Firestore rules. Owner-only validated rules were deployed by the owner on 2026-10-23; the agent never deploys. Preview and Production share one Firebase project, so a rules change affects both. Firestore `(default)` is in `asia-southeast1`.
- Firebase Authorized domains: exact hosts only (localhost, the production domain, a stable branch alias). Never all of `vercel.app`. Preview URLs are behind Vercel login.

## 7. Open items and carried risks
- Carry to G3: thin p95 margin on `/tasks` and project-route transitions, including repeat visits to the project route. Preserve the strict p95 < 100 ms threshold and the retained failed run; likely main-thread jitter, cause UNPROVEN.
- Carry to G3: a locally pending `serverTimestamp` reads as null; the G3 codec must handle pending writes (for example `serverTimestamps: "estimate"`). Dates stay Firestore timestamps on disk and numeric ms in the UI.
- Carry to G3: first-data latency remains UNVERIFIED in Production. The empty-account preview/Production checks do not reproduce the seeded 1,000-task emulator case.
- Carry to G3: cold emulator startup has thin margin (reviewer run 64.3 s to ready). The shared 90 s deadline is unchanged; retain failed/successful startup logs. The historical cold-start cause remains unproven. Firestore emulator needs Java 21+; ports stay Auth 9099 / Firestore 8081.
- Carry to G3: four high npm advisories in the Node gRPC dependency chain; affected code is absent from the browser bundle, including deferred chunks. See `docs/qa/gate-2/dependency-audit.txt`; the installed Node dependency remains vulnerable.

## 8. Commands
- Gate exit: `npm run measure:firestore-adapter && npm run build && npm run lint && npm run typecheck && npm run test && npm run test:rules && npm run e2e`, then `npm run measure:bundle`. Check `java -version` before emulator commands.
- Routine artifacts go to `test-results/gate-N/`; `--record-evidence` writes committed copies (see `docs/qa/gate-2/REVIEW.md`).
- Check script names in `package.json` if one differs.

## 9. Reviewing a gate (for Claude Code)
- Re-run the commands yourself; say which results you ran and which you only read in the docs.
- Check scope against `PLAN.md`; check each target number; check the rule greps (no `onSnapshot` outside `src/lib/subscriptions`, no hex outside `tokens.css`, no `any`, `console.log` or TODO, no file over 300 lines, exact `firebase` pin, no COOP header, `.env` not committed).
- Check attributions in `REVIEW.md` and `DECISIONS.md`, and that `TRACKER.md` ticks only what is verified.
- Give findings ranked by severity as a prompt to paste to Codex, with a clear merge or do-not-merge verdict.

## 10. Next steps
1. After this closeout branch is reviewed and merged, update main and delete merged gate and docs branches locally/remotely, verifying each is merged first. Do not delete a branch still in use by a worktree.
2. Remove the detached review worktrees at the end, after their work and any worktree-held branches are finished and their working trees are clean; preserve needed review evidence first. This worktree now holds `docs/g2-closeout` and must remain until its closeout is merged.
3. From updated main, expand `g3-projects-tasks` using `docs/PROMPTS.md` and the carried risks in section 7; review and approve the full skill before implementation.
4. Run G3 with the same gate loop, carrying the retained G2 speed risk and pending-timestamp handling forward.

## 11. Owner preferences that affect the work
- Detailed, reasoned, step-by-step explanations; an alignment review before building; all open questions in one list; do not resend large zips.
