# Gate 1 review — 2026-10-19

Branch: `gate-1-auth`. Review skill: `.agents/skills/review/SKILL.md`.
Application commit: `b3ffa18`. Gate status: all required targets verified; branch awaits review and owner merge.

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
| `npm run e2e` | 24 tests; exit 1.5 min, review 1.8 min; 0 retries |
| `npm run measure:bundle` | 126,224 bytes gzip; +30,069 over Gate 0; <200,000 |
| `npm run measure:auth-adapter` | +27,972 bytes gzip; below the 50,000-byte stop threshold |

The adapter was measured before any auth interface/bootstrap integration, with every adapter
export retained so unused popup/sign-out paths could not disappear. Commit `983bd86` preserves
that initial result. The current script reconstructs scaffold revision `6a99bb5` in memory,
reproducing Gate 0's 96,155-byte baseline and an adapter-equipped 124,127-byte bundle.
Production builds remain untouched by this measurement instrumentation.

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
agent. Passing Preview behavior does not claim that separate audit. All G1 targets now have
passing evidence; the tracker is marked complete. This follow-up changes documentation only;
the existing exit/review results apply to unchanged application code and were not rerun.

## Risks, open questions, and proposed lessons

`npm audit` reports 4 high advisories through unimported Firestore/gRPC packages in Firebase's
dependency tree. No automatic fix, override, or downgrade was applied to the approved exact pin.
Review this chain before importing Firestore in Gate 2. No other implementation questions remain.
No AGENTS.md or PLAN.md changes are proposed. The approved skill file was left untouched.

Proposed lessons for the owner to record in the skill:
- Retain all Auth adapter exports and freeze the scaffold revision when measuring adapter-only size.
- Await persisted-session resolution before shell keyboard enumeration.
- Await the emulator widget's DOMContentLoaded event before clicking its controls.
- Firebase popup cancellation includes an intentional eight-second auth-event grace period.
