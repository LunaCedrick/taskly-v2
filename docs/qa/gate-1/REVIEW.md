# Gate 1 review — 2026-10-19

Branch: `gate-1-auth`. Review skill: `.agents/skills/review/SKILL.md`.
Application commit: `5690a7c`. Gate status: all required targets verified; branch awaits review and owner merge.

## Changed

- Exact-pinned `firebase@13.0.0`; App/Auth modules only, explicit persistent Auth initialization,
  Google popup adapter, explicit local demo-emulator mode, and one app-level observer.
- One Zustand store with session/profile/pending/error fields; protected shell routes, validated
  internal return destinations, session check, approved sign-in messages, and shared profile/sign-out.
- Auth-only emulator runner, adapter-mocked unit/component coverage, browser coverage, production
  bundle measurements, and distinct Gate 1 artifacts. Gate 0 artifacts remain unchanged.
- Memoized Navigation and Drawer preserve store/context updates while avoiding unchanged route work.

## Command results

| Command | Result |
|---|---|
| `npm run build` | pass; 150 modules; 409,110 bytes uncompressed JavaScript |
| `npm run lint` | pass; 0 errors/warnings, including review rerun |
| `npm run typecheck` | pass; strict app/tooling/tests, including review rerun |
| `npm run test` | 72 tests across 8 files; exit 8.70 s, review 6.67 s |
| `npm run e2e` | 24 tests; exit 1.5 min, review 1.8 min; Playwright retries configured as 0; later Claude Code review required one whole-command rerun after a startup timeout (below) |
| `npm run measure:bundle` | 126,224 bytes gzip; +30,069 over Gate 0; <200,000 |
| `npm run measure:auth-adapter` | +27,972 bytes gzip; below the 50,000-byte stop threshold |

The adapter was measured before any auth interface/bootstrap integration, with every adapter
export retained so unused popup/sign-out paths could not disappear. Commit `983bd86` preserves
that initial working-tree pair: 96,160 -> 124,132 bytes gzip (+27,972), measured before the UI.
The current script reconstructs scaffold revision `6a99bb5` in memory,
reproducing Gate 0's 96,155-byte baseline and an adapter-equipped 124,127-byte bundle.
Production builds remain untouched by this measurement instrumentation.
Figures vary by about 100 bytes with inlined `VITE_FIREBASE_*` values: controlled env/no-env
builds differed by 113 bytes for the full bundle and 103 bytes for the adapter increase.

Routine E2E screenshots/speed JSON and both bundle measurements now write to `test-results/gate-1/`;
only an explicit `--record-evidence` updates committed snapshots in `docs/qa/gate-1/`.
Codex designed this flag in response to the Claude Code review findings.
Use `npm run e2e -- --record-evidence`, `npm run measure:bundle -- --record-evidence`, or
`npm run measure:auth-adapter -- --record-evidence` when intentionally replacing evidence.
The original artifacts and tables above remain the historical application review results.

## Performance

1,000 tasks; 60 transitions per run; CPU 4x; no tracing; auth/fonts settled; original click-to-paint
protocol and strict p95 <100 ms. No sample filtering, network exceptions, or ignored auth errors.

| Run | Exit median / p95 / max ms | Review median / p95 / max ms | Review >100 ms | Requests / console errors |
|---|---|---|---:|---|
| 1 | 48.65 / 69.90 / 140.70 | 53.60 / 66.30 / 143.00 | 1 | 0 / 0 |
| 2 | 48.05 / 59.50 / 136.50 | 56.15 / 78.20 / 199.40 | 2 | 0 / 0 |
| 3 | 47.75 / 57.60 / 137.80 | 53.35 / 75.30 / 140.60 | 1 | 0 / 0 |

Exit runs each had one >100 ms transition. Gate 0 DECISIONS.md reference: median
53.95 / 47.60 / 46.35 ms, p95 82.60 / 75.60 / 73.20 ms, max 195.10 / 224.60 / 248.90 ms.
Raw review measurements and machine details: `speed-{1,2,3}.json`.
Same machine: AMD Ryzen 5 3400G, 8 logical CPUs, 13.94 GiB RAM, Windows 10.0.19045,
Node 24.16.0, Chromium 156.0.8078.4; browser timezone Asia/Shanghai.

Earlier p95 failures 104.20 and 112.90 ms are preserved under
`diagnostics/before-navigation-memo/`. Navigation and Drawer were then memoized; both complete
post-fix runs pass. Maximum transitions still exceed 100 ms and are reported without exclusion.

## Visual and accessibility checks

Compared captured 390 × 844 and 1280 × 900 states with `sign-in.png`, the sign-in-error panel in
`states.png`, and the session panel in `states-session-not-found.png`. Nineteen screenshots cover
normal, blocked, network, generic, cancelled, session check, Dashboard, tasks, project, and drawer.

| Area | Result / adaptation |
|---|---|
| Desktop sign-in | Two columns, brand, one Google action, three value points; form sits slightly higher and value points farther left than the reference |
| Phone sign-in | Form only; heading/copy remain left-aligned from the desktop frame; brand retained above |
| Error states | Approved exact text above Google button; darker token-based alert border/text preserves AA contrast; normal retry action |
| Session check | Centered mark, Taskly heading, decorative loading bar, visible loading text; no spinner-only state |
| Profile | Real Auth name/photo with initial fallback; test screenshots use the emulator's fake profile |
| Keyboard | All shell controls reached; drawer trap, Escape/scrim dismissal and focus return pass; sign-in keyboard test passes |
| Targets / focus | At least 44 × 44 px and 3 px visible outlines |
| Overflow / motion | No horizontal overflow at either width; reduced-motion sign-in checked; session treatment is static |

Auth text/background contrast ratios: ink/bg 13.79:1; muted/bg 5.05:1; muted/sand 4.71:1;
surface/accent 4.98:1; overdue/overdue-tint 4.84:1. Focus-ring screenshots intentionally show focus.
The emulator's SDK warning banner is disabled only in explicitly enabled demo-emulator mode.
Blocked/network/generic browser faults are injected at the window boundary; unit/component tests
mock the Auth adapter. Actual popup closure exercises cancellation and retry at both widths.

## Hard-rule and scope audit

- No Firestore imports/listeners, collection-group queries, profile-document writes, or real task data.
- One app-level Auth observer; guards use the store; route changes make zero requests.
- Auth updates preserve task/project and derived-selector references; fixtures stay protected.
- Source/test/script files are all at most 300 lines. No loose types, debug logs, or TODOs in src.
- No hard-coded colors outside tokens; no new breakpoint; no COOP header.
- `firebase.json`, `AGENTS.md`, `docs/PLAN.md`, and the approved skill are unchanged from `6a99bb5`.
- No real environment values printed, replaced, or committed. Only the approved Firebase dependency added.
- Diff against main contains the approved skill commit and Gate 1 implementation, tests, and evidence.
- No new UI for configuration/startup failures or sign-out failures, per owner instruction.

## Owner preview verification

Preview: https://taskly-v2-git-gate-1-auth-lunacedricks-projects.vercel.app/

Normal push published `b3ffa18`; GitHub's Vercel status says deployment completed. This environment
redirects to Vercel login; the CLI lacks an authentication token. The owner supplied the remaining
preview evidence on 2026-10-19. Results below are owner-reported, not independently repeated by
the agent. Structured evidence is in `preview.json`.

| Preview target | Owner result |
|---|---|
| Real Google sign-in | PASS in all three timing runs |
| Refresh persistence | PASS: loading screen, then Dashboard; no sign-in form flash |
| Sidebar sign-out | PASS: protected content gone; refresh still requires sign-in |
| Phone drawer sign-out | PASS at 390x905 emulation: protected content gone; refresh still requires sign-in |
| Requested deep-link return | PASS: `/projects/project-1?sort=due#task-2`; Thesis project visible |

Chrome 155.0.8059.84 (Official Build, 64-bit), Windows 11 desktop/laptop (model not recorded),
fresh Chrome profile, no extensions. Timing: Slow 4G / 4x CPU slowdown. Functional checks:
throttling off. These manual conditions differ from the automated machine recorded above.

| Run | Popup close to visible Dashboard (ms) | Separate popup-open/account-selection interval (ms) | Result (<3000 ms) |
|---|---:|---:|---|
| 1 | 198.1 | 15,896.2 | PASS |
| 2 | 43.4 | 6,069.8 | PASS |
| 3 | 101.1 | 6,021.3 | PASS |
| Median | 101.1 | Excluded from sign-in interval | PASS |

Start: first observed Google popup closure after account selection. End: Dashboard `header h1`
becomes visible in the shell. `preview-timing.js` observes closure using 20 ms polling/window
focus and heading visibility using DOM observation/polling. Popup-open time includes provider-page
loading and is excluded from the measured sign-in interval. Wall-clock start/end timestamps
were not supplied in the owner report; no timestamps or device model were inferred.

The owner observed four `Cross-Origin-Opener-Policy policy would block the window.closed call`
messages per run and attributed them to the measurement snippet polling Google's popup, not
Taskly. The agent did not independently inspect their call stacks. No app change or COOP header
was added. Automated app console checks passed as recorded above.

Firebase/Vercel console settings and Production authentication were not directly audited by the
agent. Preview timings and console setup confirmations are owner-reported, not independently
verified. Passing Preview behavior does not claim that separate audit. All G1 targets now have
passing evidence; the tracker is marked complete. That preview-evidence update changed documentation
only. Subsequent test/tooling fixes and their checks are recorded below; app code remains unchanged.

## Review follow-up

The Claude Code review run encountered a fresh-worktree E2E startup timeout at 90 seconds, followed by a complete
24/24 pass on the next command invocation. This was a whole-command retry, not a Playwright
test retry. The corresponding temp directory contains `firebase.json` but no Firebase debug log.
The missing log suggests a stall before CLI logging initialized; its exact cause, including
whether this was a cold filesystem/module load, is **unresolved**, not a proven emulator download.
The installed CLI's Auth emulator runs bundled Node code; no separate Auth binary is downloaded.

The runner keeps the 90,000 ms deadline, captures and tees stdout/stderr, enables the Firebase
debug log, records first-output/readiness timings and the last probe error, and retains diagnostics
under `test-results/auth-emulator-*/`. A simulated CLI exit test checks output retention and
early failure. The global `firebase-tools` PATH prerequisite is recorded in DECISIONS.md.
Port-consistency tests read the real `firebase.json` and compare Auth/Firestore with the shared
9099/8081 constants. Known startup/sign-out gaps remain unchanged by owner decision (DECISIONS.md).

The env comparison uses unchanged source/dependencies with normal env loading versus an empty
`envDir`; no owner env file was edited or values printed. Full bundle: 126,224 -> 126,111 bytes
(+30,069 -> +29,956 against Gate 0); adapter: 124,127 -> 124,024 (+27,972 -> +27,869 against
the same 96,155 baseline). The Claude Code review's independent no-env full bundle was 126,110, one byte
below this in-memory comparison. Both comparisons confirm the roughly 100-byte env effect.

Follow-up build, lint and strict typecheck pass; review unit/component run: 75 tests across
10 files in 7.56 s. Browser exit and review runs each pass 24/24 in 1.7 and 1.8 minutes.
Captured diagnostic/exit/review emulator readiness: 11.480 / 12.553 / 11.892 s; first output:
1.399 / 1.434 / 1.401 s. None reproduced the timeout. No retry or deadline increase was added.

| Run | Follow-up exit median / p95 / max ms | Follow-up review median / p95 / max ms | Exit / review >100 ms | Requests / app errors |
|---|---|---|---:|---|
| 1 | 55.65 / 72.00 / 192.40 | 57.60 / 68.40 / 176.00 | 1 / 1 | 0 / 0 |
| 2 | 55.35 / 70.20 / 154.80 | 53.85 / 69.20 / 162.50 | 1 / 1 | 0 / 0 |
| 3 | 56.20 / 74.90 / 160.40 | 58.60 / 85.10 / 173.60 | 1 / 3 | 0 / 0 |

Same 1,000 tasks, 60 transitions/run, 4x CPU, machine and strict p95 <100 ms protocol as above;
both follow-up suites pass, as did the earlier 66.30 / 78.20 / 75.30 ms review p95 values.
Nineteen fresh screenshots were written locally; shell keyboard/overflow checks pass at both widths.
Output flag checks passed in scratch fixtures. All 28 pre-existing committed JSON/PNG artifacts
remain byte-identical to `be43ece`. Intentional follow-up summary: `review-followup.json`.

## Runner test and attribution corrections (base `5690a7c`)

The startup-failure test now uses a Node preload only in its fixture child: port checks bind
OS-assigned ports and readiness fetches reject without contacting any real service. The checked-in
runner is unchanged. Both isolated tests still assert fake CLI exit 23 and retained failure output.
The regression case holds port 9099, or uses an already occupied port without stopping its owner.

Build, lint and strict typecheck pass. Normal unit suite: 76 tests across 10 files in 7.43 s.
A separate full `npm run test` with a TCP listener bound to `127.0.0.1:9099` also passed 76/76
across 10 files in 7.40 s; the listener remained open throughout, then the proof harness closed it.
Browser suite: 24/24 in 1.6 min, including keyboard/overflow checks and 19 local screenshots.

| Run | Median / p95 / max ms | >100 ms | Requests / app errors |
|---|---|---:|---|
| 1 | 49.90 / 59.20 / 142.10 | 1 | 0 / 0 |
| 2 | 48.15 / 58.70 / 138.60 | 1 | 0 / 0 |
| 3 | 49.70 / 59.80 / 129.60 | 1 | 0 / 0 |

Same 1,000 tasks, 60 transitions/run and 4x CPU protocol; all p95 values remain below 100 ms.
The fresh-worktree failure is attributed to the Claude Code review run; the flag design is
attributed to Codex. The application reference is `5690a7c`; the stale G1 tracker row is preserved
and marked superseded. Latest check details are in `review-followup.json` under `reviewCorrections`.

## Risks, open questions, and proposed lessons

`npm audit` reports 4 high advisories through unimported Firestore/gRPC packages in Firebase's
dependency tree. No automatic fix, override, or downgrade was applied to the approved exact pin.
`npm audit --omit=dev` still reports 4 high, 0 other advisories; current Gate 1 `dist` has 0
case-insensitive `grpc` matches. After importing Firestore and rebuilding in Gate 2, rerun
`npm audit --omit=dev` and `rg -i "grpc" dist`; today's Auth-only result does not establish that result.
The historical startup timeout's root cause remains open; it was not reproduced in follow-up.
No AGENTS.md or PLAN.md changes are proposed. The approved skill file was left untouched.

Proposed lessons for the owner to record in the skill:
- Retain all Auth adapter exports and freeze the scaffold revision when measuring adapter-only size.
- Await persisted-session resolution before shell keyboard enumeration.
- Await the emulator widget's DOMContentLoaded event before clicking its controls.
- Firebase popup cancellation includes an intentional eight-second auth-event grace period.
