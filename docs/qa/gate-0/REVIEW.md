# Gate 0 review — follow-ups 2026-10-18

Branch: `gate-0-shell-speed`. Reference: `.agents/skills/review/SKILL.md`.

## Command results

| Command | Final result |
|---|---|
| `npm run build` | pass; 123 modules; Vite JavaScript 97.09 kB gzip |
| `npm run lint` | pass; 0 errors, 0 warnings |
| `npm run typecheck` | pass; app, tooling, and tests strict; 0 errors |
| `npm run test` | 10 tests across 2 files passed, 27.27 s |
| `npm run e2e` | 5 tests passed, 33.4 s; no retries; 60 measured transitions per speed run |
| `npm run measure:bundle` | 96,155 bytes gzip, 308,068 bytes uncompressed |
| `npm run lighthouse` | pass; pinned 13.5.0; mobile performance 99, accessibility 100, LCP 1,856.726 ms, TBT 88.5 ms |

Final route runs at 4x CPU: medians 53.95 / 47.60 / 46.35 ms; p95 82.60 / 75.60 / 73.20 ms;
max 195.10 / 224.60 / 248.90 ms. Each run measured 60 transitions and made zero network requests
with zero console errors. The test fails when p95 >= 100 ms (pass is strictly under 100 ms).
All three runs passed on the first attempt. No application code, features, or dependencies changed.
Previous accepted 20-transition p95 was 73.30 / 99.60 / 77.90 ms. Current machine details and the
retained informational unvirtualized comparison are in DECISIONS.md.

## Measurement cleanup

Kept six final JSON artifacts: `bundle.json`, `lighthouse.json`, `speed-1.json`, `speed-2.json`,
`speed-3.json`, and `speed-unvirtualized.json`. The unvirtualized comparison is the final accepted
2026-10-17 comparison and was not rerun. The three new speed JSON files each contain 60 raw samples
and verified median, nearest-rank p95, and max summaries. Screenshots are unchanged.

Removed exactly these 15 superseded JSON files (paths relative to `docs/qa/gate-0/`):

- `focus-review/speed-1.json`
- `focus-review/speed-2.json`
- `focus-review/speed-3.json`
- `implementation/speed-1.json`
- `implementation/speed-2.json`
- `implementation/speed-3.json`
- `initial/speed-1.json`
- `initial/speed-2.json`
- `initial/speed-3.json`
- `initial/speed-unvirtualized.json`
- `review/speed-1.json`
- `review/speed-2.json`
- `review/speed-3.json`
- `lighthouse-initial.json`
- `lighthouse-font-optimized.json`

## Visual comparison

Inspected the saved screenshots at 390 × 844 and 1280 × 900 against the local design frames.
Screenshots: `dashboard-{390,1280}.png`, `my-tasks-{390,1280}.png`,
`project-{390,1280}.png`, and `drawer-390.png` in this folder.

| Area | Differences from `docs/design/` | Reason / scope |
|---|---|---|
| All views | Counts, project progress, task titles, and dates differ from the illustrated sample | Deterministic 1,000-task fixture, fixed reference time 2026-10-17 noon |
| Desktop shell | Header actions sit higher; navigation/project rows and profile have more vertical space | 44 px target minimum, shared placeholder header; visual refinement remains |
| Dashboard desktop | Section spacing differs; recent activity is a single placeholder instead of four events | Gate 0 placeholder; full activity content is Gate 4 |
| Dashboard phone | Dismiss button is visible; Upcoming continues below Today; phone due labels retain pill backgrounds | Dismissible notice and three real selector groups; two previews per group |
| Lists | Bounded scroll area, 64 px rows, many fixture tasks, read-only completion marks | Accessible virtualized performance fixture; completion writes are Gate 3 |
| Project | Additional simple name/count header and completion text; no main progress bar, status pills, filters, edit/delete controls, or add-row | Gate 0 placeholder; full project interface belongs to later gates |
| My Tasks | All 1,000 tasks rather than a filtered four-row result; no functional search, filters, or highlighted matches | Search and filtering are Gate 5 |
| Drawer phone | Explicit close button; different project row spacing and sample progress | Keyboard dismissal and focus management; same 300 px drawer |
| Floating add | No heavy shadow; same 56 px circle; inert in this gate | Design rules prohibit heavy shadows; Quick Add is wired in Gate 3 |
| Typography | Self-hosted variable weights; Newsreader optical size fixed at 16 | Smaller critical font payload; headings remain Newsreader |

Phone My Tasks has no dedicated reference frame; derived from desktop My Tasks and phone Project view,
as permitted by SCREENS.md. No horizontal overflow at either required width. Long lists retain focused
rows when scrolling; Arrow Up/Down and Home/End preserve logical positions. Drawer traps Tab,
closes on Escape or scrim click, and returns focus to the trigger.
Every visible shell control was reached with Tab at both widths; measured targets were at least
44 × 44 px and keyboard focus outlines at least 3 px. Screenshot dimensions are 390 × 844 and
1280 × 900 viewports; full-page Dashboard captures extend vertically to include Upcoming and padding.

## Scope and limitations

No Firebase dependency, authentication, listeners, real data, writes, task/project forms, functional
search/filters/alerts, or Quick Add interaction. Existing Firebase configuration is untouched.
The Vercel rewrite is configured locally; no production deployment was performed.
Browser title is `Taskly` under the owner's explicit Gate 0 instruction.

## Hard-rule audit

- Listener, loose-type, debug-log, TODO, and color-outside-tokens searches: zero matches in `src`.
- No source, test, or script file exceeds 300 lines.
- Only one 820 px media condition, in tokens.css. Dynamic virtual offsets are measured geometry.
- Feature folders do not import another feature's internals; lists are shared under `src/ui`.
- No Firebase dependency, no COOP header, and no environment files staged.
- Diff against `main` contains only Gate 0 implementation, verification, assets, and approved documentation.

## Proposed document changes

AGENTS.md and PLAN.md are unchanged. DECISIONS.md already recorded the interim 100 KB initial-JS
target, the 820 px breakpoint exception, and phone Projects opening the drawer; DESIGN.md now records
all three, including the reason that G0 has no `/projects` index route.
G0 is unchecked in TRACKER.md; the owner ticks it after merge. No additional document changes proposed.

Open questions: none for Gate 0. Later-gate interfaces remain placeholders as listed above.
