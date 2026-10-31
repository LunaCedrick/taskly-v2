# G3 checkpoint-2 row-layout addition (2026-10-31)

**INCOMPLETE — stopped after two unsuccessful resize follow-ups.** Latest full
e2e at source `2183186`: **51 passed / 3 failed**. Initial phone geometry passes;
phone→desktop→phone virtual-list row separation fails. Earlier passes below do
not supersede this failure. No further code fix or unchanged-code rerun was tried.

Scope: requested items 7–8 on `gate-3-projects-tasks`. No deployment, rule edit,
dependency change or later-gate implementation. This report follows the earlier
[toast recheck](CHECKPOINT-2-RECHECK.md); its historical evidence is unchanged.

## Reproduction and implementation

Changed source/tests: `src/ui/TaskRow.tsx`, `src/ui/TaskRow.module.css`,
`src/ui/TaskList.tsx`, `src/styles/tokens.css`, and
`tests/e2e/g3-row-layout.spec.ts`. Other changes are G3 reports, rollout and evidence.

The owner described Preview at 360×800 in Samsung Galaxy A55 emulation. The owner's
screenshot was not attached in this turn; the description was read. Browser
reproduction uses Chromium at 320×800, 360×800, 390×800 and 1280×900.

- Baseline UI `88fd844`, new spec: `emulator-Lz8VaR` reproduces phone clipping in
  the plain list: long-title scrollHeight/clientHeight **210/35, 88/35, 88/35 px**
  at 320/360/390. Parts extend outside their row; 320 also has due/Edit overlap.
  The wide plain-list check passes. All observations/screenshots are retained.
- Four baseline virtual cases could not observe the selected short task because
  it was outside the mounted range, not because it disappeared from the store.
  The first integration run `emulator-TLEkvj` passes all four plain-list checks;
  the same four virtual fixture failures remain. Changing a due date did not move
  the selected task into view: this G2 view retains document-ID order. The fixture
  now selects the first two project document IDs. No product ordering changed.
- With that fixture correction, `emulator-VELUW7` passes six cases; at 320 the
  long due chip wraps below its project label in both list modes. Title clipping,
  overlap, horizontal overflow and target-size checks pass, but the lower-band
  alignment check fails. Measured label + gap + chip need about 145 px; the group
  has about 136 px. Token-based phone column gaps now shrink from 12 to 4 px to
  provide about 152 px, keeping both buttons at 44 px or larger. This concrete
  adjustment is validated below; the failed results remain retained.
- `TaskRow.tsx` marks mutable rows; CSS changes apply to Project rows only. Below
  the existing 820 px breakpoint, a grid places checkbox/title in the first band
  and project/due/priority/actions in the second. Title clamp/overflow are removed;
  row height is auto with the existing minimum. Long text can grow the row.
- Edit/Delete remain always visible and right aligned, with 44 px targets. The
  non-interactive priority dot does not reserve a 44 px column on phones; labels
  and chips can wrap when space requires. All dimensions/styles use existing tokens
  and new layout tokens at the existing single breakpoint.
- Desktop retains its flex layout, 64 px rows and existing one-line title treatment;
  the common long-title fixture wraps on phones and fits wide without clipping.
  Other routes keep their existing row layout and read-only behavior.
- `TaskList.tsx` measures only phone mutable virtual rows, preserving fixed desktop
  estimates and the existing focused/revealed-row retention. On a layout-mode
  change it resets cached heights and remeasures current phone rows. Editing a title
  reflows later rows through ResizeObserver. No listener, query or writer changed.
- Read the installed TanStack implementation and its
  [measurement API](https://tanstack.com/virtual/latest/docs/api/virtualizer#measureelement).
  Browser coverage exercises both plain lists (6 tasks total) and virtualization
  (1,000 tasks total / 334 in the project), long/short titles, a much longer edited
  title, phone→desktop→phone resizing, and End/Home focus/scrolling.

## Rollout record

The owner answered **“Yes, confirmed zero console errors”** to the explicit question
about the Preview console check. Only after that reply, row (e) was changed to the
requested text: **“owner-verified by the owner on 2026-10-31; formal 12-sample timing
table not retained”**. No timing values, URL/build identity or device measurements
are inferred. Rows (a)–(d) are preserved, including (d)'s unverified Firebase console
Rules tab text check. Browser console confirmation does not verify published rules.
Row (f) stays UNVERIFIED. No live console/Preview/Production check was run by the agent.

## Validation

G3-specific per-run artifacts are retained under `row-layout-recheck` and unique
`emulator-*` directories. The baseline and failed fixture attempt are not replaced
by later results. Targeted final run `emulator-5BDgCv`: **8 passed, 31.8 s**.
All requested geometry checks, same-band alignment, growth on edit, desktop layout,
resize round-trips and keyboard End/Home checks pass in both list modes.
Source/test/rollout commit **`bae7308`** was pushed before its full suite:
build/lint/typecheck PASS, **223 unit / 122 rules / 54 e2e tests PASS**; bundle
134,736 / 141,230 / 275,966 B. [That full run](row-layout-recheck/final-suite.json)
and all its route samples are retained.

API review found a resize bookkeeping issue not covered by the original
console-error assertion: TanStack retains observers on connected measured rows.
Removing `data-index` on return to desktop leaves those callbacks without their
required index. **`2183186`** retains the index while keeping measurement refs
phone-only, and adds an assertion against the specific missing-index warning during
resize/keyboard checks. That source/test follow-up was pushed before the final
[verification suite](row-layout-recheck/verified-suite.json). **That full run fails**
at `g3-row-layout.spec.ts:125`: after returning to phone width, mounted virtual
rows overlap at 320, 360 and 390. All initial requested geometry checks pass;
the later growth/keyboard/warning assertions are not reached in those three tests.
Wide virtual and all plain-list cases pass. This source follow-up is retained;
the earlier full pass does not establish its correctness.

A second attempt supplied `measureElement: (element) =>
element.getBoundingClientRect().height` to bypass the default helper's cached
synchronous size. [Targeted result](row-layout-recheck/current-geometry.json):
**5 passed / 3 failed, 48.0 s**, `emulator-rhH4lN`, the same resize/separation
assertion at all three phone widths. The cached-size explanation alone therefore
does not establish the cause. This unproven two-line override was removed, returning
app/test source exactly to `2183186`; its patch and failed traces remain in evidence.

AGENTS.md workflow 8 says **“If a fix fails twice, stop and report what you tried.
Do not loop.”** Code changes stop here. A future approved investigation should
inspect measured-element/cache/observer lifecycle across breakpoints; no third
fix, threshold relaxation, disabled assertion or extra diagnostic was applied.

Final retained source `2183186` command results (existing local `.env` Firebase
configuration inlined, values not read/printed/changed):

| Command | Result | Command duration |
|---|---|---|
| `npm run build` | PASS | 6.651 s |
| `npm run lint` | PASS | 18.245 s |
| `npm run typecheck` | PASS | 10.430 s |
| `npm run test` | PASS: 223 tests / 30 files, no skips; Vitest 88.75 s | 90.101 s |
| `npm run test:rules` | PASS: 122 tests / 2 files; Vitest 12.01 s | 28.916 s |
| `npm run e2e -- --record-evidence` | **FAIL: 51 passed / 3 resize failures**; 4.9 min tests | 317.527 s |
| `npm run measure:bundle` | PASS: initial 134,734 / deferred 141,232 / total 275,966 B | 0.978 s |

The normal production graph has no initial Firestore runtime or modulepreloads
reaching it; test observers/probes are absent. Initial is strictly below 200,000 B.
Deltas from G2's 127,820 / 137,162 / 264,982 B: **+6,914 / +4,070 / +10,984 B**.
These bytes depend on the existing local Firebase configuration. G2 evidence is
unchanged. The current-geometry override was not retained in app code or fully gated.

[All six route runs / 360 samples](SPEED-ROW-RECHECK.md) are retained, including
every >100 ms sample and route-pair count. Latest three p95s: **68.5 / 65.6 / 70.0 ms**.
Q15's immediately preceding qualifying unchanged-main baseline was not run;
these sessions count as neither acceptance pass nor fail. No regression inference,
new diagnostic or Production latency measurement is made.

Earlier targeted geometry (`emulator-5BDgCv`) is identical in both list modes;
latest `emulator-jQaXSl` initial geometry also passes, but its resize checks fail:

| Width | Long title scroll/client height | Short title scroll/client height | Row height | Height after longer edit |
|---|---|---|---|---|
| 320 | 35/35 px | 18/18 px | 117 px | 213 px |
| 360 | 35/35 px | 18/18 px | 117 px | 195.5 px |
| 390 | 35/35 px | 18/18 px | 117 px | 178 px |
| 1280 | 18/18 px | 18/18 px | 64 px | Existing desktop clamp retained |

In those initial/earlier passing observations: zero overlapping part boxes, no title extending outside its row, no list/page
horizontal scroll and no overlapping adjacent rows. All three action targets meet
44×44 px; Edit/Delete are right aligned. Earlier passing phone→desktop→phone checks
return the desktop row height to 64 px; latest phone row separation fails as above.
[320 screenshot](emulator-5BDgCv/g3-project-rows-plain-320.png),
[360 virtual growth](emulator-5BDgCv/g3-project-rows-virtual-grown-360.png),
[390 screenshot](emulator-5BDgCv/g3-project-rows-plain-390.png),
[1280 screenshot](emulator-5BDgCv/g3-project-rows-virtual-1280.png).

## Ran versus only read

Ran: `java -version` (Temurin 21.0.12.1), baseline browser reproduction and the
verification commands recorded above. No emulator/startup deadline was changed.

Only read: AGENTS, the G3 skill, relevant PLAN/SCREENS/DESIGN and decision/rollout
records, row/list/store integration, installed virtualizer source, its API reference,
and the owner's Preview observation/console confirmation. No Firebase console rules
text, real-device timing table, Production or gate acceptance result was verified.
