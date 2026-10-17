# Gate 0 review — 2026-10-17

Branch: `gate-0-shell-speed`. Reference: `.agents/skills/review/SKILL.md`.

## Command results

| Command | Final result |
|---|---|
| `npm run build` | pass; 123 modules; Vite JavaScript 97.09 kB gzip |
| `npm run lint` | pass; 0 errors, 0 warnings |
| `npm run typecheck` | pass; app, tooling, and tests strict; 0 errors |
| `npm run test` | 10 tests across 2 files passed, 2.77 s |
| `npm run e2e` | 5 tests passed, 15.5 s; no retries |
| `npm run measure:bundle` | 96,155 bytes gzip, 308,068 bytes uncompressed |
| `npm run lighthouse` | pass; pinned 13.5.0; mobile performance 99, accessibility 100, LCP 1,855.924 ms, TBT 81 ms |

Final route runs at 4x CPU: medians 55.60 / 56.65 / 53.40 ms; p95 73.30 / 99.60 / 77.90 ms.
Every run made zero network requests and logged zero console errors. All prior measurements,
including failures and the unvirtualized comparison, are listed in DECISIONS.md with machine details.
Previous review p95 was 75.20 / 91.70 / 83.40 ms. A later 100.60 ms failure led to seeding the virtual
list's initial rectangle and reducing overscan; the test threshold stayed strictly below 100 ms.
The 99.60 ms final run has only 0.40 ms margin and is an explicit risk for future gates.

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

No AGENTS.md or PLAN.md edits applied. Future owner edits could record the interim ~100 kB Gate 0
JavaScript target and the CSS media-condition exception in the permanent hard rules.

Open questions: none for Gate 0. Later-gate interfaces remain placeholders as listed above.
