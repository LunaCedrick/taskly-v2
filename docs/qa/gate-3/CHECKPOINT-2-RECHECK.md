# G3 checkpoint-2 recheck addition (2026-10-31)

Subsequent [row-layout recheck](CHECKPOINT-2-ROWS.md) updates row (e) after owner confirmation.

Scope: owner-requested items 5–6 only, on `gate-3-projects-tasks`. No rule edit,
deployment, dependency change, later-gate work, or gate-completion claim.
Q21 in `docs/decisions/g3.md` copies the owner's observation verbatim. Other
implementation notes here are the agent's findings, not owner decisions.

## Toast reproduction and change

- Baseline `7bcbfc7` UI, with new browser assertions: `emulator-Bm40RS` reproduces
  the success toast beneath Quick Add at **390×844**. At **1280×900** it sits outside
  the card but beneath the scrim, dimmed and inert. Real emulator rejection produces
  the designed error toast; the modal/backdrop intercepts all seven sampled hit tests
  in each of Quick Add, edit, delete-task and delete-project at both widths. All four
  tests fail their unobscured assertions, intentionally retained as reproduction.
- [Baseline command/result](toast-layering-recheck/baseline.json) and
  [screenshots/geometry/hit tests](emulator-Bm40RS/toast-errors-390.json).
  Baseline observation JSON's `testStatus: passed` was captured before the assertions;
  it is not the final result. The command log records **4 failed**. New observations
  are saved in `afterEach` so their status is final.
- `Toasts.tsx` uses one manual popover in the browser top layer. The persistent
  controller retains the existing queue, five-second timer, hover/focus pause and
  sticky errors when its portal moves between body and active dialog. Normal cap,
  identical-error merging and recovery drafts in `toast-queue.ts` are unchanged.
- `WriteOverlay.tsx` and the phone `Drawer.tsx` register open dialog DOM hosts in the
  write store; removing the top host restores the preceding host. The toast
  portal descends from the active modal so its controls are not inert. It re-enters
  the top layer after dialog opening/mode changes. No autofocus is added.
- Token-based placement remains bottom-left on desktop and above the tab bar/FAB on
  phones without a dialog. With a phone dialog, placement moves to the viewport top
  to avoid its primary actions. This placement adjustment is derived from item 5;
  it is not attributed to the owner as a separate design decision. No new copy or
  inline message. Quick Add remains open; Enter clears and retains title focus.
- Browser assertions check text visibility, viewport bounds, hit-test clearance at
  toast corners/text/buttons, open-popover state, no primary-button overlap, actual
  dismissal, and keyboard access to Recover draft while a modal is open. Errors are
  tested across Quick Add, edit, both deletion dialogs, new project and rename at
  both widths, plus the phone menu. All native dialog declarations are covered.
- API references read: [showPopover](https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement/showPopover)
  and the [HTML modal inertness rule](https://html.spec.whatwg.org/multipage/interaction.html#modal-dialogs-and-inert-subtrees).

## Rollout evidence

`ROLLOUT.md` now records exactly the 2026-10-31 owner report: (a)–(c) verified;
(d) deployment at **10:39 AM, Asia/Shanghai**, owner report only. Console Rules tab
text/publication checks and the deployed checkout/commit are not inferred. (e) and
(f) remain UNVERIFIED; formal Preview and second-device timing samples are pending
the final head. Production verification and populated first-data latency remain
unverified. The old checkpoint report is historical; this recheck supersedes its
statement that every rollout row is unverified. No agent deployment occurred.
Item 6 uses the owner's report only: no Firebase/Vercel console inspection, live
sign-in/write check, rules publication check or Production check was performed here.

## Validation

Source/test/decision/rollout commit: **`d326f82`**; all-dialog follow-up:
**`d03acb1`**, both pushed before final checks.
The first integration run (`emulator-Piw1K2`) retained **5 passes / 6 failures**:
closing a dialog detached its toast portal before the host update, and `showPopover`
on that disconnected element raised a page error. The corrected effect checks
connectivity and the modal's open state. Success visibility already passed at both
widths in that first run. The first lint run also found an empty fixture binding;
the hook now records the actual browser name. Both failed logs are retained.

The preliminary unit run passed **223 tests / 30 files**; typecheck passed.
The batch at `d326f82` passed build/lint/typecheck, 223 unit tests and 122 rules
tests, then was interrupted during e2e to include the phone menu native dialog.
Its manifest explicitly records the interruption; no final e2e result is inferred.
Interrupted emulator `5DcVKF` output is retained; it produced no committed browser
samples/screenshots. No full-suite/acceptance pass is claimed for that batch.
Final source `d03acb1`: [command manifest and compressed logs](toast-layering-recheck/final-suite.json).
Existing strict speed thresholds and Q15's qualifying-main-baseline rule remain
unchanged. No extra diagnostic session is authorized or run by this addition.

| Command | Result at final source | Command time |
|---|---|---|
| `npm run build` | PASS | 6.22 s |
| `npm run lint` | PASS | 17.52 s |
| `npm run typecheck` | PASS | 9.87 s |
| `npm run test` | PASS, 223 tests / 30 files, no skips | 108.77 s (Vitest 107.25 s) |
| `npm run test:rules` | PASS, 122 tests / 2 files | 38.19 s (Vitest 15.36 s) |
| `npm run e2e -- --record-evidence` | PASS, 46 tests, including all four new layering tests | 303.62 s (tests 4.5 min) |
| `npm run measure:bundle` | PASS, initial/deferred/total 134,639 / 141,227 / 275,866 B gzip | 0.88 s |

Normal production build: existing local `.env` Firebase config is inlined; values
were not read, printed or changed. Compared with G2's 127,820 / 137,162 / 264,982 B,
the deltas are **+6,819 / +4,065 / +10,884 B**. Initial stays strictly below
200,000 B. The hash-validated production graph has no initial/preloaded runtime
Firestore; dedicated e2e globals/probe-module names are absent from normal output.
SDK/listener source searches were read; runtime registrations remain under
`src/lib/subscriptions`. No G2 evidence was rewritten.

Navigation p95: **85.2 / 81.1 / 74.1 ms**, 60 samples each; four samples over
100 ms remain included. [Every route pair and slow transition](SPEED-TOAST-RECHECK.md).
Zero navigation-attributed requests; three unchanged listener registrations/active
handles. **Not Q15 acceptance:** no immediately preceding qualifying unchanged-main
baseline. Earlier failed speed runs remain retained; this run does not establish
their cause or prove a regression absent. No additional diagnostics were run.

New browser assertions PASS in `emulator-6RYrlz` (Chromium viewports; one seeded task):

| Viewport | Success / Quick Add | Error dialogs | Clear sampled points |
|---|---|---|---|
| 390×844 | PASS; remains open, title empty/focused | Quick Add, edit, task/project deletion, rename, new project, menu | 55/55 |
| 1280×900 | PASS; remains open, title empty/focused | Quick Add, edit, task/project deletion, rename, new project | 48/48 |

All 15 observations fit the viewport and avoid primary actions; dismissal and
Tab→Recover draft→Enter pass. Error-case page-error arrays are empty. These viewport
tests do not replace the owner's real-device checks. [Mobile success](emulator-6RYrlz/g3-success-toast-open-quick-add-390.png),
[desktop success](emulator-6RYrlz/g3-success-toast-open-quick-add-1280.png),
[mobile errors](emulator-6RYrlz/toast-errors-390.json),
[desktop errors](emulator-6RYrlz/toast-errors-1280.json).

Shared-file changes: Drawer and WriteOverlay only register/unregister modal hosts;
the write store holds their stack. Toasts owns the existing timer and portal; CSS
and tokens set its top-layer placement. The new browser spec covers visual and
keyboard behavior. Queue policy, listener/writer code and rules are unchanged.
The final evidence commit changes documentation/artifacts only; tested app/test
source remains `d03acb1`. G3 completion, Q15 acceptance, formal Preview/second-device
results, console publication verification, Production checks and end-of-gate review
are not claimed. Stop here for the owner's checkpoint recheck.

## Ran versus only read

Ran: `java -version` (Temurin 21.0.12.1), the new baseline browser assertions,
and the validation commands/results recorded below. All evidence paths are G3-only.

Only read: AGENTS, G3 skill, review skill instructions, relevant PLAN/SCREENS/DESIGN
sections, toast/Quick Add phone frames, existing decisions/checkpoint/rollout records,
toast queue, write coordination, emulator/browser fixtures/configuration and API
references. End-of-gate review and owner/manual checks are not claimed by this recheck.
