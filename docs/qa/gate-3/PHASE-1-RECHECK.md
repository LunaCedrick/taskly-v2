# G3 phase-1 app recheck (2026-11-02)

Scope: requested app fixes after `50afd43`, on `gate-3-projects-tasks`.
No Q14 Quick Add timing, Q15 acceptance, gate closeout, rules/dependency/AGENTS/PLAN
edit or deployment. Q23–Q24 in `docs/decisions/g3.md` copy only the supplied owner
sentences; all earlier owner blocks are preserved.

## Changes and per-item verification

| Item | Change | Ran | Only read / carried |
|---|---|---|---|
| 1 Stale reveal | Both TaskList effects consume the matching reveal after applying the scroll. No clear for a task absent from that list. The extra reveal range entry is temporary. | Four browser cases: 150/1,000 account tasks at 390/1280; initial Quick Add reveal still scrolls, then completion, route return and My Tasks stay at scrollTop 0. Virtual added rows unmount after scrolling to top. | `write-actions.ts` reveal request, list/store publication and selectors. No writer change. |
| 2 Blank page scroll | `.scroll` is positioned relative, containing row sr-only content within its overflow. | Two browser cases, 390/1280; project with 20 rows and My Tasks with 60. Blank overflow beyond the normal main/viewport bounds is 0 in all four observations. | Global sr-only rule and Shell/main geometry. Normal content may still need page scrolling. |
| 3 WriteUI route subscription | Memoize WriteUI; move both routing hooks into a child mounted only while deleted-project navigation is pending. WriteUI and Toasts no longer render on route changes, but WriteOverlay still does. | Three component tests use a mocked WriteOverlay and Toasts; their counters cannot observe actual WriteOverlay renders. Matching deletion navigates; unrelated deletion does not. Three-run-per-side A/B diagnostic completed below. | Reviewer commit-hook probe: actual WriteOverlay rendered on 15/15 route changes without a subscribed value changing. No overlay code change in phase 2. |
| 4 Floating button | Add phone list bottom clearance using existing `--content-bottom` (112 px); use the same token for virtualizer scrollPaddingEnd and CSS scroll padding. Desktop clearance stays 0. | Six browser cases: 320/360/390 × plain/virtual Project list, after keyboard End and maximum scroll. No FAB/Delete overlap; all five sampled points hit Delete, targets are at least 44 px, no horizontal overflow. | Shell FAB geometry, tokens and SCREENS Quick Add bottom-padding requirement. |
| 5 Focus limitation | Correct the tabindex claim; Q23 accepts focus loss and scroll reset above 200 Project tasks when crossing 820 px. No focus fix. | No new Tab/ArrowDown measurement or fix. Existing remount geometry tests remain. | Recheck reports body focus, ineffective ArrowDown, Tab reaching row 1's checkbox and overwriting stored index. Historical snapshots only established retained attributes. |
| 6 Priority | Record phone dot-only priority as a carried G6 item; no priority code change. | No new priority measurement. | Current `--phone-priority-display:none` / TaskRow sr-only text, and the recheck's design-frame text comparison. |
| 7 References | Label final remount screenshots as `emulator-BDlWFa` / `0541208`; clarify that Q22 contains authorization, not the conversation's fallback text. Quote no fallback. | Checked referenced final screenshot paths exist. | Earlier remount report and evidence. |

The route subscription was missed earlier: the preceding patches left the existing
unconditional hooks in WriteUI. Functional tests did not assert that this subtree
stayed still during navigation. This was an omission, not an approved tradeoff.

## Separate pushed commits

- `a2ea293`: Q23–Q24 verbatim owner decisions.
- `812b331`: one-shot reveal and its browser cases.
- `07d39c6`: sr-only containment and plain-list browser cases.
- `730b95f`: WriteUI isolation and component tests.
- `05e7944`: phone list clearance and six browser cases.
- `5fd18d2`: diagnostic protocol and optional harness mode, committed before runs.
- `c5985f7`: accurate breakpoint keyboard limitation.
- `6bbc90d`: carried G6 priority item.
- `85ea26a`: final screenshot labels and Q22 provenance.
- `7adfd6d`: actual browser identity in saved layout observations; assertions unchanged.

App/test source is frozen at `7adfd6d`; app behavior last changed in `05e7944`.
Evidence/report commits do not alter that source. No new requirement is selected.

## Targeted results and retained failures

Evidence: `phase1-app-4Hp67A`, plus unique `emulator-*` directories.

- Initial reveal test invocation (`emulator-fa1Nzi`): **4 failed**. It clicked a
  first-row locator, then incorrectly expected that moving locator to remain the
  clicked task after publication. The rendered first row changed to task-10.
  This run did not establish an app regression. Its log, four traces and four
  compressed error contexts are retained. No app change was made in response.
- Corrected task-ID-pinned assertion (`emulator-9Yux4L`): **4 passed, 25.1 s**.
  Initial reveals scroll by 4,263 / 17,882 px on phones and 2,114 / 16,634 px wide
  for 150 / 1,000 tasks respectively. Then afterComplete, maximum observed scroll
  after completion, route return and My Tasks are all **0 px** in every case.
- Overflow (`emulator-3MYPAJ`): **2 passed, 8.6 s**. No document overflow beyond
  legitimate main/viewport content, with both 20-row and 60-row plain lists.
- WriteUI: **3 component tests passed**, Vitest 26.74 s. Mocks count renders of
  non-memoized overlay/toast children while the actual WriteUI and router execute.
  This does not establish render isolation of the real WriteOverlay; the reviewer
  subsequently measured 15/15 route-change renders of that component.
- FAB (`emulator-HtfElP`): **6 passed, 25.2 s**. Delete bottom **559 px** versus FAB
  top **658 px** at all three widths, both list modes and both scrolling methods;
  the saved rectangles and hit tests are retained. Final-head coverage follows below.

No fixed emulator/startup deadline, assertion threshold or app code was changed
to obtain a passing timing result. All earlier G0–G3 evidence remains untouched.

## Diagnostic session

Protocol: [PHASE-1-SPEED-PROTOCOL.md](PHASE-1-SPEED-PROTOCOL.md), committed in
`5fd18d2` before measurements. A is clean unchanged main; B is the committed branch.
The comparison covers entire main/G3 builds, not an isolated causal WriteUI effect.

First session `phase1-speed-8gWS1k` stopped **before any build or timing sample**:
Chrome process count was 11 despite the owner closing its visible window. A
follow-up found ten installed Chrome processes and zero visible windows. The
abort and zero-sample session are retained; neither is a numeric branch pass/fail.
After the explicit owner reply “End background Chrome processes”, rechecked zero
visible windows and ended three processes belonging only to the exact installed
Chrome path. The immediate tool count was one remaining process; the subsequent
new session recorded 13 checks at zero. No process was ended before the answer.

Complete session: `phase1-speed-olTMAH`, A1/B1/A2/B2/A3/B3, **360 samples**.
All six command exits are 0. Main/branch share >100 ms: **1/180 = 0.56% each**;
pooled p95: **59.8 / 64.1 ms**; pooled p99: **94.3 / 99.0 ms**;
slow repeat tasks→project transitions: **0 / 0**. Branch tails are numerically
higher; three runs per side cannot prove a regression either way. All per-run,
route-pair and slow-sample details are in [PHASE-1-SPEED.md](PHASE-1-SPEED.md).
No code was changed in response and no acceptance claim is made.

## Final-head suite

`phase1-app-4Hp67A/full-suite.json` records the exact source head, environment,
commands, exit codes, durations and compressed logs. All requested checks pass at
**7adfd6df0047bc5b03cd6ca352b08b6aa1a49e45**; the final evidence commit changes
no app/test source. Full e2e directory: `emulator-nr3Mb0`.

| Command | Result | Duration |
|---|---|---|
| `npm run build` | PASS | 6.023 s |
| `npm run lint` | PASS | 144.230 s |
| `npm run typecheck` | PASS | 415.246 s |
| `npm run test` | PASS: 226 tests / 31 files, no skips; Vitest 95.89 s | 97.332 s |
| `npm run test:rules` | PASS: 122 tests / 2 files; Vitest 12.11 s | 28.974 s |
| `npm run e2e -- --record-evidence` | PASS: 66 tests, 5.2 min | 330.559 s |
| `npm run measure:bundle` | PASS | 0.855 s |

The full run includes all twelve new browser cases and the eight prior row-layout
cases. Final screenshots include [plain overflow 390](emulator-nr3Mb0/g3-plain-project-page-390.png),
[Delete 320](emulator-nr3Mb0/g3-final-delete-maximum-1000-320.png),
[Delete 360](emulator-nr3Mb0/g3-final-delete-maximum-1000-360.png),
[Delete 390](emulator-nr3Mb0/g3-final-delete-maximum-1000-390.png).
Full-suite navigation p95: **57.5 / 56.8 / 60.2 ms**, 180 samples, none >100 ms.
All per-route counts and earlier diagnostic slow samples are retained in PHASE-1-SPEED.
These remain ordinary suite measurements, not Q15 acceptance.

Normal production bundle: initial **134,878**, deferred **141,228**, total **276,106 B** gzip.
Deltas from G2 127,820 / 137,162 / 264,982 B: **+7,058 / +4,066 / +11,124 B**.
Initial remains strictly under 200,000 B. Runtime Firestore remains outside the entry
static/modulepreload graph; production observer/probe absence is checked from the graph.

Normal build uses existing local `.env` Firebase configuration; values were not
read, printed or changed. Bundle bytes and the production graph are retained.
Java: Temurin 21.0.12.1. No dependency installation or rule deployment occurred.

## Owner records and stop

Q24 replaces the old twelve-sample second-device record with the owner's actual
2026-10-31 Preview observation. No timing values or measured one-second pass are
inferred from “could not perceive any delay”. Q14 Quick Add timing stays unrun in
phase 1. Q15 acceptance and closeout work wait until these app fixes are rechecked.
ROLLOUT/TRACKER/review/closeout documents are not updated by this phase.

Only read: governing instructions, relevant SCREENS/PLAN/design and decision
records, integration and diagnostic code, and reviewer/owner observations. No live
Preview/Production, Firebase console or physical-device verification was performed.
G2's thin route-speed margin and unverified Production latency remain carried risks.

Stop after the requested phase-1 checks and report; no later-gate implementation.
