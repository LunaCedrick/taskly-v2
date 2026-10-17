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

2026-10-17, branch `gate-0-shell-speed`. Production build, 1,000 deterministic tasks, three projects.
Machine: DESKTOP-4HM6D76, AMD Ryzen 5 3400G (4 cores / 8 logical CPUs), 13.94 GiB usable RAM,
Windows 10 Pro x64 10.0.19045, Node 24.16.0, npm 11.16.0, Playwright 1.64.1,
Chromium 156.0.8078.4. Browser timezone: Asia/Shanghai.

Each speed run performs 20 trusted clicks between Dashboard, My Tasks, and Thesis, with CDP CPU
throttling at 4x. Timing starts in the click capture handler, waits for the target view and rows,
then crosses a rendering opportunity with two animation frames. Nearest-rank p95 must be **<100 ms**;
the test fails at 100 ms. No tracing during timing. Initial fonts finish before navigation is measured.
These are lab interaction measurements, not field INP.

| Run | Median ms | p75 ms | p95 ms | Navigation requests | Result |
|---|---:|---:|---:|---:|---|
| Implementation 1 | 54.20 | 61.10 | 91.40 | 0 | pass |
| Implementation 2 | 58.45 | 63.60 | 94.70 | 0 | pass |
| Implementation 3 | 68.15 | 73.90 | 86.30 | 0 | pass |
| Review 1 | 56.50 | 61.30 | 75.20 | 0 | pass |
| Review 2 | 59.50 | 70.20 | 91.70 | 0 | pass |
| Review 3 | 58.10 | 63.00 | 83.40 | 0 | pass |
| Focus review 1 | 59.60 | 72.70 | 100.60 | 0 | fail |
| Focus review 2 | 56.90 | 65.50 | 79.80 | 0 | pass |
| Focus review 3 | 51.50 | 58.30 | 96.20 | 0 | pass |
| Final 1 | 55.60 | 64.80 | 73.30 | 0 | pass |
| Final 2 | 56.65 | 59.10 | 99.60 | 0 | pass |
| Final 3 | 53.40 | 60.90 | 77.90 | 0 | pass |

Raw samples and machine details: `docs/qa/gate-0/speed-{1,2,3}.json` for final results, and matching
files under `implementation/`, `review/`, and `focus-review/` for previous runs.
After the 100.60 ms failure, seeded the virtualizer's initial rectangle and reduced overscan from 5 to 3
so navigation no longer needs an empty first render before measuring its visible range.
**Risk:** final run 2 has only 0.40 ms margin. Machine contention and subsequent feature work can break
the budget; retain the strict failure condition and remeasure every gate. No failing run was discarded.

Informational comparison, virtualization disabled: My Tasks median **1,137.7 ms**, p95 **2,088.4 ms**
(7 My Tasks transitions within 20 total route changes). See `speed-unvirtualized.json`.
This comparison is excluded from routine exit checks; reproduce with `npm run measure:unvirtualized`.

Initial diagnostic runs are retained under `docs/qa/gate-0/initial/`: medians 113.30, 119.40, 102.00 ms;
p95 143.80, 148.70, 197.30 ms. The first harness included browser tracing and an extra animation frame.
The implementation also repeatedly read computed styles while estimating 1,000 row heights.
Cached row geometry and date formatters, corrected the extra frame, and disabled tracing before the
implementation runs above. Initial unvirtualized My Tasks median/p95: 1,660.9/2,350.8 ms.
The first Lighthouse command was cancelled during package setup to avoid overlapping audits and timing.

Final initial-load JavaScript baseline: **96,155 bytes gzip** (Node zlib default), 308,068 bytes uncompressed.
Vite reports **97.09 kB gzip** using its compressor settings. Earlier implementation baseline:
96,068 bytes gzip, 307,782 bytes uncompressed (Vite 97.00 kB). All routes are eagerly bundled;
the measurement script counts every emitted JS chunk, including shared chunks.
The first data-router build was 113.60 kB gzip in Vite; declarative routing reduced it without lazy requests.
Interim target: about 100 kB gzip; hard budget: <200 kB. **Risk:** Firebase/Auth will add JavaScript
in later gates, so this baseline must be compared again before accepting those gates.

### Gate 0 implementation decisions (owner approved 2026-10-17)

Lighthouse 13.5.0, default mobile simulated throttling (150 ms RTT, 1,638.4 Kbps, 4x CPU),
production shell with the same machine and Chromium listed above:

| Audit | Performance | Accessibility | LCP ms | Total blocking time ms | Result |
|---|---:|---:|---:|---:|---|
| Initial | 63 | 100 | 2258.344 | 5643.5 | fail |
| Font optimization | 99 | 100 | 1969.442 | 71.5 | pass |
| Final | 99 | 100 | 1855.924 | 81.0 | pass |

All scores retained in `lighthouse-initial.json`, `lighthouse-font-optimized.json`, and `lighthouse.json`
under `docs/qa/gate-0/`. A separate startup CPU profile took 139 ms wall time without throttling;
it did not reproduce the initial audit's 5.6-second blocking task. The font payload reduction is
measured; attributing the entire blocking-time improvement to that change is not supported.
Final audit: zero failing accessibility audits. Raw Lighthouse HTML/JSON/trace are generated in
ignored `test-results/` by `npm run lighthouse`; compact scores/configuration are committed.

- Extend the existing scaffold; no Firebase package, auth, listeners, or data writes in this gate.
- Virtualize My Tasks and Project view only above 200 rows. Dashboard uses the complete overdue,
  today, and upcoming selectors but renders two rows per group, without virtualization.
- Lists expose `role="list"`, `aria-setsize`, and `aria-posinset`. Large lists support Arrow Up/Down,
  Home/End with a roving tab stop. The focused row remains mounted when scrolling away.
- The phone Projects tab opens the existing menu drawer; no projects index route. Recorded in SCREENS.md.
- The 820 px breakpoint is the sole media-condition size exception, in `src/styles/tokens.css`.
  CSS custom properties cannot be substituted into media query conditions. No duplicate breakpoint.
- Self-host Latin WOFF2 variable fonts with `font-display: swap`, both critical font preloads, and OFL
  license files. Instrument Sans: 30,092 bytes; Newsreader: 58,084 bytes. Both retain variable weights;
  Newsreader fixes optical size at 16, saving 73,916 bytes versus the initial optical-size variable font.
  No navigation font requests.
- The temporary favicon is `data:,`. Page title is `Taskly`, following the owner's Gate 0 instruction.
- `vercel.json` rewrites every path to `/index.html`. No Cross-Origin-Opener-Policy header is configured.
- Lighthouse runs through pinned `npx --yes lighthouse@13.5.0` in an npm script; it is not a dependency.
