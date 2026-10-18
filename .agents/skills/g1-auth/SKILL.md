---
name: g1-auth
description: "Use to build Gate 1 of Taskly: Google sign-in, protected routes, the session check, and the sign-in error states."
---

# Gate 1: Authentication

Status: draft, awaiting owner approval. Do not implement this gate until the skill and the implementation plan are approved.

Goal: add persistent Google authentication without slowing navigation or exposing the shell before the session resolves.
Read: `docs/PLAN.md` section 3, section 4 (Auth row only), and section 10 (common requirements and G1 only); `docs/SCREENS.md` (Sign in and States only).
Visual references: `docs/design/sign-in.png`, the sign-in error panel in `states.png`, and the session-check panel in `states-session-not-found.png`. Other panels are outside this gate.
Do not: edit `AGENTS.md` or `docs/PLAN.md`; add Firestore imports, listeners, profile-document writes, real task data, CRUD, or other sign-in providers. Keep Gate 0 fixtures behind protected routes. No file over 300 lines.
Use the existing design tokens and shared controls. Explain changes outside the auth feature before making them. Ask before adding dependencies or implementing behavior the named references do not specify.

## Pages and features
- Sign in at `/sign-in`: two columns on desktop; form only on phone
- One sign-in action: "Continue with Google"
- Session check at app start while persisted authentication resolves
- Sign-in errors: popup blocked, network failure, cancellation
- Signed-in user's avatar/name and Sign out in the sidebar and phone drawer
- Protected Dashboard, My Tasks, and Project routes

## Targets (all must be met)
- A signed-out visit to a protected route goes to `/sign-in`; successful sign-in returns to the requested internal route. A new sign-in without a requested route goes to Dashboard.
- Refresh preserves the session. Neither protected content nor the sign-in form flashes while session status is unknown.
- Signed-in users visiting `/sign-in` are redirected without seeing the form.
- Popup-blocked, network, and cancelled sign-in each show the approved message above the button in a `role="alert"` box.
- Sign out works from the sidebar and drawer, removes authenticated access, and returns to sign-in.
- Sign in to Dashboard shell takes under 3 seconds on the Vercel preview over throttled 4G; record the measurement.
- One app-level Auth observer; route changes neither restart authentication nor clear task/project data. No Firestore listeners in Gate 1.
- Common to every gate: route-change p95 under 100 ms with 1,000 tasks and CPU throttled 4x; lint, typecheck, unit and end-to-end tests pass; no console errors; no horizontal scroll at 390 and 1280 px; run the `review` skill.

## Steps
1. Inspect the existing scaffold and Gate 0 integration points. Propose the Gate 1 implementation plan, dependency changes, files, test setup, and risks; wait for approval. Then work on `gate-1-auth` with small imperative commits. Skill approval alone does not authorize app implementation.

2. Resolve the two gaps in the references before coding:
   - The designed popup-blocked copy is: "Sign-in failed: the popup was blocked. Allow popups for this site and try again." Network and cancellation wording is not supplied in the inspected frames; get the owner's approval for that copy and any necessary error fallback.
   - Agree on the start/end of the preview's under-3-second sign-in measurement. Record Google/account-selection time separately where applicable; do not silently redefine the target or claim an emulator result proves preview performance.

3. Configure Firebase Auth after dependency approval.
   - Create `src/lib/firebase/client.ts`: initialize one Firebase app from `VITE_FIREBASE_*` configuration; import only the app/Auth modules required by this gate.
   - Create `src/lib/firebase/emulator-config.ts`: shared emulator ports, Auth 9099 and Firestore 8081. Auth code and test tooling consume this constant; Firestore stays stopped.
   - Create `src/lib/firebase/auth.ts`: persistent browser authentication, Google popup sign-in, sign-out, and the Auth-observer adapter. Configure emulator connections only when explicitly enabled for local tests; never infer emulator mode merely from a development build.
   - Modify `package.json` and `package-lock.json` only for approved dependencies and scripts. Propose `firebase`; do not assume it is already approved.
   - Modify `.env.example` with configuration names and the explicit emulator flag, using placeholders only. Do not print, commit, or replace the owner's real environment values.

4. Add session state to the existing store.
   - Create `src/store/auth-slice.ts`; modify `src/store/index.ts` to integrate it into the same Zustand store.
   - Store checking/signed-out/signed-in status, the needed user profile fields, pending actions, and approved errors. Components subscribe through selectors; do not create a second auth store or duplicate state in component/context state.
   - Create `src/features/auth/session.ts` to start and stop the app-level observer and apply its results to the store. Modify `src/main.tsx` to start it once at bootstrap and clean up on disposal.
   - Set up persistence before enabling sign-in. Open the popup directly from the user's action, without unrelated asynchronous work that can lose the browser gesture.
   - Update session status from the observer; avoid a competing redirect in the popup promise handler. Keep initialization and cleanup safe under StrictMode and hot reload.

5. Protect routing through store state.
   - Create `src/lib/auth-redirect.ts`: pure helpers for internal return destinations; reject external destinations and sign-in redirect loops.
   - Create `src/features/auth/RequireAuth.tsx` and `src/features/auth/SignedOutOnly.tsx`; modify `src/app/routes.tsx` to apply them.
   - While checking, render the session-check screen. When signed out, remember the requested pathname, query, and hash before redirecting. After sign-in, replace the sign-in history entry with the validated return destination or Dashboard.
   - Guards read the store only. Do not call Firebase, fetch data, or reset the store on navigation.

6. Build the sign-in and session-check interfaces.
   - Create `src/features/auth/SignInPage.tsx`, `SignInPage.module.css`, `SessionCheck.tsx`, and `SessionCheck.module.css`.
   - Match the named frames: desktop form and three value points; phone form only. Reuse existing tokens, fonts, controls, and breakpoint treatment.
   - The session check has the Taskly mark, visible loading text, and the designed loading treatment; never a spinner alone. It is an initial auth state, not a loader shown on every route change.
   - Create `src/lib/auth-errors.ts` for pure error classification and approved message mapping.
   - Create `src/features/auth/auth-actions.ts` to coordinate sign-in/sign-out through the Auth adapter and store. Prevent duplicate pending requests, restore the sign-in action after failure/cancellation, and allow retry through the same Google button.
   - Keep keyboard focus visible, errors announced, targets at least 44 px, AA contrast, and reduced motion.

7. Wire the signed-in profile and sign-out.
   - Create `src/features/auth/UserMenu.tsx` and `UserMenu.module.css` for the avatar/name and Sign out.
   - Modify `src/app/Navigation.tsx` to replace the Gate 0 profile placeholder with this shared component, covering both sidebar and drawer.
   - Modify `src/app/Shell.module.css` only as needed to remove the replaced placeholder styles. Preserve the drawer's focus trap, dismissal, and focus return.
   - Do not add a settings route, account-management menu, or new profile persistence.

8. Write unit tests:
   - `tests/unit/auth-errors.test.ts`: blocked, network, and cancellation mappings; handling of unknown input according to the approved fallback.
   - `tests/unit/auth-redirect.test.ts`: default Dashboard destination, internal deep links including query/hash, external destinations, and redirect-loop rejection.
   - `tests/unit/auth-session.test.ts`: checking to signed-out/signed-in transitions, observer cleanup and duplicate-start protection, sign-out, pending/error recovery, and unchanged task/project references during auth-only updates.
   - Mock the Firebase adapter boundary; do not contact real Google/Firebase services in unit tests.

9. Write component tests:
   - `tests/unit/auth-routes.test.tsx`: session check while unresolved, no protected-content/form flash, signed-out redirect with return destination, signed-in return, and signed-in rejection of the sign-in route.
   - `tests/unit/sign-in.test.tsx`: one Google action, pending-request prevention, all three alert messages, and retry after failure/cancellation.
   - `tests/unit/user-menu.test.tsx`: store-backed profile and sign-out action.
   - Test behavior rather than matching source text or duplicating implementation details.

10. Add emulator-backed browser coverage.
    - Create `scripts/run-e2e.mjs` to start the Auth emulator, derive its CLI configuration from the shared port constant, build/serve an explicitly emulator-connected app, run Playwright, and clean up owned processes. Use an emulator-only demo project.
    - Use existing Firebase CLI tooling if available; otherwise propose an approved pinned npx invocation. Do not add `firebase-tools` or another test dependency without approval.
    - Modify `package.json` so `npm run e2e` invokes this runner; modify `playwright.config.ts` for the coordinated server/test environment.
    - Create `tests/e2e/fixtures/auth.ts` for reusable emulator authentication; do not add a production auth-bypass route or switch.
    - Create `tests/e2e/auth.spec.ts`: Google-provider emulator flow, signed-out Dashboard/tasks/project deep links, return destination, refresh persistence, signed-in sign-in-route redirect, sidebar/drawer sign-out, and popup cancellation.
    - Modify `tests/e2e/shell.spec.ts` and `tests/e2e/speed.spec.ts` to authenticate before existing protected-shell checks. Keep all Gate 0 assertions and the strict p95 failure at 100 ms.
    - Capture sign-in, session-check, and approved error states at 390 and 1280 px. Check keyboard access, focus, console errors, overflow, and compare with the frames. Cover blocked/network errors deterministically through the approved adapter mocks; emulator tests do not replace the real-provider preview check.

11. Measure and verify the preview.
    - Run the existing speed test with 1,000 tasks, 20 transitions, 4x CPU, and zero navigation requests after auth/fonts settle. Record median/p95 and the machine; do not exclude auth errors or change the budget to make it pass.
    - Run `npm run measure:bundle` after a production build and record Firebase Auth's impact against the Gate 0 initial-JavaScript baseline.
    - On the Vercel preview, manually sign in with real Google, refresh, sign out, and verify return to a requested deep link. Check the provider/domain setup if sign-in is blocked; do not change external project settings without the owner's authorization.
    - Measure the agreed sign-in interval over throttled 4G. Record URL, browser/device, network/CPU settings, start/end, duration, and any provider interaction. If preview access is unavailable, report the target as unverified.

12. Run the exit commands, fix failures, then run the `review` skill.
    - Record automated and manual results in `docs/DECISIONS.md` under "Gate 1 measurements".
    - Update `docs/TRACKER.md` as work proceeds; mark G1 complete only when every required target is verified.
    - Explain any additional file changes before making them. Stop and report if a fix fails twice.

## Exit commands
`npm run build && npm run lint && npm run typecheck && npm run test && npm run e2e`

Then `npm run measure:bundle` against that production build. The end-to-end command must include the authenticated shell and speed tests.

All commands must pass. Report test counts, route median/p95, navigation requests, and initial JavaScript gzip size. Also report the real-Google preview checks and the under-3-second measurement; these are required even when emulator tests pass. Run the `review` skill after the gate checks pass.

## Report
- Changed files and resulting authentication behavior
- Command results with counts and timings; each target met, failed, or unverified
- Preview sign-in timing, measurement conditions, bundle change, and route-speed results
- Screenshots compared with the named frames; differences and phone adaptations
- What was not done, open questions, and proposed `AGENTS.md` or `docs/PLAN.md` changes; do not edit those files
- Append up to five dated lessons below after implementation

## Lessons
(none yet)
