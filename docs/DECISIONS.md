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
| 2026-10-16 | Firestore emulator on 8081 | Because 8080 is used by an Oracle listener on the owner’s machine. | Some files uses old 8080 emulator port |

## Gate 0 measurements

2026-10-18 review follow-ups, branch `gate-0-shell-speed`. Production build, 1,000 deterministic tasks, three projects.
Machine: DESKTOP-4HM6D76, AMD Ryzen 5 3400G (4 cores / 8 logical CPUs), 13.94 GiB usable RAM,
Windows 10 Pro x64 10.0.19045, Node 24.16.0, npm 11.16.0, Playwright 1.64.1,
Chromium 156.0.8078.4. Browser timezone: Asia/Shanghai.

Each speed run performs 60 trusted clicks between Dashboard, My Tasks, and Thesis, with CDP CPU
throttling at 4x. Timing starts in the click capture handler, waits for the target view and rows,
then crosses a rendering opportunity with two animation frames. The test fails when
nearest-rank **p95 >= 100 ms** (pass is strictly under 100 ms). No tracing during timing.
Initial fonts finish before navigation is measured. JSON includes median, p95, max, and all 60 samples.
These are lab interaction measurements, not field INP.

| Accepted run | Median ms | p95 ms | Max ms | Navigation requests | Result |
|---|---:|---:|---:|---:|---|
| 1 | 53.95 | 82.60 | 195.10 | 0 | pass |
| 2 | 47.60 | 75.60 | 224.60 | 0 | pass |
| 3 | 46.35 | 73.20 | 248.90 | 0 | pass |

Raw samples and machine details: `docs/qa/gate-0/speed-{1,2,3}.json`. These replace the older 20-click
measurements. Superseded raw JSON was removed per review; `docs/qa/gate-0/REVIEW.md` lists all 15 deletions.
**Risk:** the p95 budget passes, but the maximum observed transition remains above 100 ms in each run.

Virtualizer: its initial rectangle is seeded and overscan reduced from 5 to 3 (after a 100.60 ms p95 failure).
Navigation then needs no empty first render before the visible range is measured.

Earlier failing runs (20 clicks, kept in git history, commit 625eb3b): focus review 1 p95 100.60 ms;
initial diagnostics p95 143.80 / 148.70 / 197.30 ms. Causes and fixes: tracing, an extra frame, repeated style reads.

Final accepted informational comparison from 2026-10-17, virtualization disabled:
My Tasks median **1,137.7 ms**, p95 **2,088.4 ms**
(7 My Tasks transitions within 20 total route changes). See `speed-unvirtualized.json`.
This comparison is excluded from routine exit checks; reproduce with `npm run measure:unvirtualized`.

Final initial-load JavaScript baseline: **96,155 bytes gzip** (Node zlib default), 308,068 bytes uncompressed.
Vite reports **97.09 kB gzip** using its compressor settings. All routes are eagerly bundled;
the measurement script counts every emitted JS chunk, including shared chunks.
Interim target: about 100 kB gzip; hard budget: <200 kB. **Risk:** Firebase/Auth will add JavaScript
in later gates, so this baseline must be compared again before accepting those gates.

### Gate 0 implementation decisions (owner approved 2026-10-17)

Lighthouse 13.5.0, default mobile simulated throttling (150 ms RTT, 1,638.4 Kbps, 4x CPU),
production shell with the same machine and Chromium listed above:

| Audit | Performance | Accessibility | LCP ms | Total blocking time ms | Result |
|---|---:|---:|---:|---:|---|
| Final accepted, 2026-10-18 | 99 | 100 | 1856.726 | 88.5 | pass |

Only the final accepted audit is retained in `docs/qa/gate-0/lighthouse.json`.
Final audit: zero failing accessibility audits. Raw Lighthouse HTML/JSON/trace are generated in
ignored `test-results/` by `npm run lighthouse`; compact scores/configuration are committed.

- Extend the existing scaffold; no Firebase package, auth, listeners, or data writes in this gate.
- Virtualize My Tasks and Project view only above 200 rows. Dashboard uses the complete overdue,
  today, and upcoming selectors but renders two rows per group, without virtualization.
- Lists expose `role="list"`, `aria-setsize`, and `aria-posinset`. Large lists support Arrow Up/Down,
  Home/End with a roving tab stop. The focused row remains mounted when scrolling away.
- The phone Projects tab opens the project drawer (the existing menu drawer), because G0 has no `/projects` index route. Recorded in SCREENS.md.
- The 820 px breakpoint is the sole media-condition size exception, in `src/styles/tokens.css`.
  CSS custom properties cannot be substituted into media query conditions. No duplicate breakpoint.
- Self-host Latin WOFF2 variable fonts with `font-display: swap`, both critical font preloads, and OFL
  license files. Instrument Sans: 30,092 bytes; Newsreader: 58,084 bytes. Both retain variable weights;
  Newsreader fixes optical size at 16, saving 73,916 bytes versus the initial optical-size variable font.
  No navigation font requests.
- The temporary favicon is `data:,`. Page title is `Taskly`, following the owner's Gate 0 instruction.
- `vercel.json` rewrites every path to `/index.html`. No Cross-Origin-Opener-Policy header is configured.
- Lighthouse runs through pinned `npx --yes lighthouse@13.5.0` in an npm script; it is not a dependency.

## Gate 1 measurements

2026-10-19: implementation plan and exact-pinned `firebase@13.0.0` approved by the owner.
Keep `firebase.json` (including its emulators block) unchanged. Add no UI for missing/invalid
configuration or sign-out failures. Gate 1 remains incomplete until every required target is verified.

Adapter-only size check, before auth UI, store, guards, or bootstrap changes:
`npm run measure:auth-adapter` builds the same scaffold twice in memory, retaining every adapter
export in the second build so popup/sign-out code cannot be removed as unused. Both builds count
every emitted JavaScript chunk using Node's default gzip settings. Firebase App/Auth imports only;
no Firestore imports. Node 24.16.0, Vite 8.3.4.

| Measurement | Bytes gzip |
|---|---:|
| Recorded Gate 0 baseline | 96,155 |
| Matched committed scaffold baseline | 96,155 |
| Committed scaffold plus complete Auth adapter | 124,127 |
| Adapter increase against matched baseline | 27,972 |
| Owner stop threshold (exceeded only above this value) | 50,000 |

Result: pass. The initial check, before building the interface, measured 96,160 to 124,132 bytes;
its 27,972-byte increase is preserved in commit `983bd86`. The reproducibility check loads the
committed Gate 0 scaffold (`6a99bb5`) in memory and reproduces the original 96,155-byte baseline,
with the same 27,972-byte increase. Evidence: `docs/qa/gate-1/auth-adapter-bundle.json`.
The measurement exposes all adapter exports only in an in-memory build.

Installation added 82 packages. `npm audit` reported 4 high advisories through the unimported
Firestore/gRPC dependency chain. No dependency override, downgrade, or automatic fix was applied.
Final build, lint, and strict typecheck pass. Unit/component tests: 72 across 8 files; exit run
8.70 s, review rerun 6.67 s. Browser tests: 24 passed in the exit run (1.5 min) and again during
review (1.8 min), including authenticated shell, keyboard/drawer behavior, and navigation speed.
Production JavaScript: 126,224 bytes gzip (409,110 uncompressed), a 30,069-byte increase over
Gate 0, below the 200,000-byte budget. All commands and hard-rule checks in the review skill passed.

Navigation uses 1,000 fixture tasks, 60 trusted-click transitions per run, 4x CPU, fonts/auth
settled before measuring, and no tracing. Timing still crosses the route commit and paint using
the original two-animation-frame protocol. No samples or auth errors were excluded.

| Run | Exit median / p95 / max ms | Review median / p95 / max ms | Review >100 ms | Requests / console errors |
|---|---|---|---:|---|
| 1 | 48.65 / 69.90 / 140.70 | 53.60 / 66.30 / 143.00 | 1 | 0 / 0 |
| 2 | 48.05 / 59.50 / 136.50 | 56.15 / 78.20 / 199.40 | 2 | 0 / 0 |
| 3 | 47.75 / 57.60 / 137.80 | 53.35 / 75.30 / 140.60 | 1 | 0 / 0 |

Each exit run had one transition over 100 ms. All six runs pass strict p95 <100 ms; maxima
remain above 100 ms. Review raw samples and machine details: `docs/qa/gate-1/speed-{1,2,3}.json`.
Machine: DESKTOP-4HM6D76, AMD Ryzen 5 3400G, 8 logical CPUs, 13.94 GiB RAM, Windows 10.0.19045,
Node 24.16.0, Chromium 156.0.8078.4, browser timezone Asia/Shanghai.
Gate 0's DECISIONS.md p95 reference was 82.60 / 75.60 / 73.20 ms at the same 4x CPU setting.

An earlier full run failed at p95 104.20 and 112.90 ms. Its three raw runs are retained under
`docs/qa/gate-1/diagnostics/before-navigation-memo/`. Memoizing Navigation and Drawer avoids
recomputing unchanged navigation/profile trees on each route; NavLink context and store selectors
still update. Two complete post-fix runs passed. The sample count and failure threshold are unchanged.
Emulator browser setup now waits for the popup widget's DOMContentLoaded event before clicking.
Cancellation assertions allow the SDK's intentional eight-second auth-event grace period.

Nineteen screenshots cover the shell/drawer and auth states at 390 and 1280 px. Visual comparison,
phone adaptations, contrast ratios, scope checks, and proposed lessons are in `docs/qa/gate-1/REVIEW.md`.
No horizontal overflow or keyboard/focus regressions were found. Auth text/background contrast
pairs range from 4.71:1 to 13.79:1; focus targets are at least 44 px and outlines at least 3 px.

Preview: https://taskly-v2-git-gate-1-auth-lunacedricks-projects.vercel.app/
Normal `git push` published application commit `b3ffa18`; GitHub's Vercel status reports
"Deployment has completed". This environment is redirected to Vercel sign-in; the Vercel CLI
also has no authentication token. No external project settings were changed.

The owner supplied passing real-Google preview results on 2026-10-19; these were not independently
repeated by the agent. Chrome 155.0.8059.84 (Official Build, 64-bit), Windows 11 desktop/laptop
(model not recorded), fresh profile, no extensions. Timing conditions: Slow 4G and 4x CPU slowdown;
functional checks used no throttling.

| Run | Popup close to visible Dashboard (ms) | Separate popup-open/account-selection interval (ms) | Result (<3000 ms) |
|---|---:|---:|---|
| 1 | 198.1 | 15,896.2 | PASS |
| 2 | 43.4 | 6,069.8 | PASS |
| 3 | 101.1 | 6,021.3 | PASS |
| Median | 101.1 | Excluded from sign-in interval | PASS |

Start: first observed Google popup closure after account selection. End: visible Dashboard
`header h1` in the shell. The console-only snippet observes closure with 20 ms polling/focus and
heading visibility with DOM observation/polling. Popup-open time includes provider-page loading.
Wall-clock start/end timestamps were not supplied; no timestamps or device model were inferred.

| Required preview evidence | Owner result |
|---|---|
| Real Google sign-in | PASS in all three timing runs |
| Refresh persistence | PASS: loading screen, then Dashboard; no sign-in form flash |
| Sidebar sign-out | PASS: protected content gone; refresh still requires sign-in |
| Phone drawer sign-out | PASS at 390x905 emulation: protected content gone; refresh still requires sign-in |
| Requested deep-link return | PASS: `/projects/project-1?sort=due#task-2`, Thesis project visible |

The owner observed four `Cross-Origin-Opener-Policy policy would block the window.closed call`
messages per timing run and attributed them to the measurement snippet's cross-origin popup
polling, not Taskly. The agent did not independently inspect their call stacks. No app code or
COOP header was changed. Raw structured evidence is in `docs/qa/gate-1/preview.json`.
Firebase/Vercel console settings and Production authentication were not directly audited by the
agent; successful Preview behavior does not claim that separate audit. All required G1 targets
now have passing automated or owner-provided evidence; G1 is marked complete in the tracker.
The branch still awaits review and the owner's merge.
