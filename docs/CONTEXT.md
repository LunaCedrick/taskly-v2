# Taskly v2: project context (handoff)

Last updated: 2026-10-19. If anything here conflicts with the repo (`docs/TRACKER.md`, `docs/DECISIONS.md`, `docs/PLAN.md`, `AGENTS.md`), the repo wins. Update this file at the end of each gate.

## 1. What this is and who does what
- Taskly v2 is a ground-up rebuild of a personal task manager, designed so route changes are instant and never touch the network.
- Repo: https://github.com/LunaCedrick/taskly-v2. Hosting: Vercel (Production from `main`, Preview per branch). Firebase: Google Auth and Firestore (Spark plan).
- Roles: Codex builds each gate. Claude plans, designs and reviews. The owner (Ced) decides, tests in the browser, merges and, in practice, approves each tracker tick. Claude Code reviews read-only; it never commits to a gate branch.

## 2. Where things are
- `AGENTS.md`: Codex's rules (read by Codex). `CLAUDE.md`: Claude Code's rules (imports `AGENTS.md`).
- `docs/`: `PLAN.md` (scope, gates, targets), `SCREENS.md`, `DESIGN.md`, `DECISIONS.md` (measurements and decisions), `TRACKER.md`, `PROMPTS.md`, `SETUP.md`, `design/*.png`, `qa/gate-N/` (evidence, `REVIEW.md`).
- `.agents/skills/`: one skill per gate (`g0-shell-and-speed`, `g1-auth` are full; later gates are outlines until expanded and approved) plus `review`. These are Codex's folder; read them by path.
- Stack: React 19, TypeScript strict, Vite, React Router, Zustand, TanStack Virtual, CSS variables and CSS Modules, Firebase modular SDK (`firebase@13.0.0`, exact pin), Vitest, Testing Library, Playwright, Firebase Emulator Suite.

## 3. Status
| Gate | What | Status |
|---|---|---|
| G0 | Shell and speed | Merged |
| G1 | Google auth, protected routes | Merged (PR #1, plain merge commit) |
| G2 | Store, sync, security rules | Next: skill must be expanded and approved first |
| G3 | Projects, tasks, Quick Add | Outline |
| G4 | Dashboard | Outline |
| G5 | Search, filters, sort, alerts | Outline |
| G6 | QA and deploy | Outline |
| R1/R2/R3 | Production check, update portfolio Taskly scene, retrospective | After G6 |

Production check after the G1 merge (owner): [ ] Production build of `main` Ready, [ ] production sign-in works, [ ] `/tasks` deep link does not 404. Confirm and tick here.

## 4. Global targets (every gate)
- Route-change p95 under 100 ms (strict; 1,000 tasks, CPU throttled 4x), zero navigation requests.
- Initial JavaScript under 200,000 B gzip. G1 ended at 126,224 B (Auth added 27,972 B).
- Lighthouse mobile at least 90, LCP under 2.5 s, no horizontal scroll at 390 and 1280 px.
- lint, typecheck, unit and browser tests pass, no app console errors, `review` skill run.
- G1 results: route p95 under 100 ms in all runs (final 59.2 / 58.7 / 59.8 ms); 75 unit/component tests, 24 browser tests. Owner-measured real-Google sign-in, popup close to Dashboard: 198.1 / 43.4 / 101.1 ms, median 101.1 ms.

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
- Never deploy test-mode Firestore rules. Rules are deny-all until G2 replaces them with owner-only rules.
- Firebase Authorized domains: exact hosts only (localhost, the production domain, a stable branch alias). Never all of `vercel.app`. Preview URLs are behind Vercel login.

## 7. Open items and carried risks
- Earlier Auth-emulator startup stall (90 s deadline) never reproduced; start takes about 11.5 to 12.6 s; logs are retained. G2 adds the Firestore emulator (needs Java).
- Four high npm advisories in Firestore/gRPC dependencies, not in the bundle yet. In G2: run `npm audit --omit=dev`, grep `dist` for "grpc", record the answer.
- p95 margin is thin: one transition near 170 ms in each speed run; record which routes. First visit to a route can take 200 to 380 ms; revisit in G3 with real lists.
- Known gaps by decision, no new UI: missing Firebase config at startup (fail loudly), sign-out failure (stay signed in, allow retry).
- Bundle headroom for G2 and later: about 74 KB under the 200,000 B budget.

## 8. Commands
- Gate exit: `npm run build && npm run lint && npm run typecheck && npm run test && npm run e2e`, then `npm run measure:bundle`.
- Routine artifacts go to `test-results/gate-N/`; `--record-evidence` writes committed copies (see `docs/qa/gate-1/REVIEW.md`).
- Check script names in `package.json` if one differs.

## 9. Reviewing a gate (for Claude Code)
- Re-run the commands yourself; say which results you ran and which you only read in the docs.
- Check scope against `PLAN.md`; check each target number; check the rule greps (no `onSnapshot` outside `src/lib/subscriptions`, no hex outside `tokens.css`, no `any`, `console.log` or TODO, no file over 300 lines, exact `firebase` pin, no COOP header, `.env` not committed).
- Check attributions in `REVIEW.md` and `DECISIONS.md`, and that `TRACKER.md` ticks only what is verified.
- Give findings ranked by severity as a prompt to paste to Codex, with a clear merge or do-not-merge verdict.

## 10. Next steps
1. Confirm the production check in section 3; run `java -version`.
2. `git switch main && git pull` in Codex's folder; delete `gate-1-auth` and `gate-1-auth-before-approval-20261019`; remove the detached review worktree.
3. Expand the g2 skill (prompt in `docs/PROMPTS.md`, plus the G2 constraints in section 7), have it reviewed, then approve.
4. Run G2 with the same loop as G1.

## 11. Owner preferences that affect the work
- Detailed, reasoned, step-by-step explanations; an alignment review before building; all open questions in one list; do not resend large zips.
