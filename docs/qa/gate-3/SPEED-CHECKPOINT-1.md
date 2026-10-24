# Checkpoint 1 navigation measurements

## Checkpoint 2 regression-monitor protocol (2026-10-25)

Commit and push this protocol before running the monitor. One fixed session only:
A1 B1 A2 B2 A3 B3, unchanged main versus the checkpoint-2 branch. Each run retains
60 trusted-click transitions, the same 1,000-task fixture size, 4× CPU, resolved
Auth/data/fonts/session-lazy modules, tracing off, and the existing two-frame paint
measurement. Use normal e2e builds with identical explicit fake Firebase configuration
and empty envDir, without a no-probe variant or additional profiles/diagnostics.
Freeze and record exact revisions and build environments in the session manifest.

Use a unique G3 session directory and separate A1–A3/B1–B3 directories. Copy main's
fixed `test-results/gate-2/speed-1.json` immediately after every run with a freshness
check. Retain failed commands, missing-sample outcomes and all raw samples; do not
rerun a slow test or replace any previous evidence. Keep per-run results, route-pair
counts and every >100 ms transition with first/repeat destination annotations.

Reading rule: pool all retained samples separately for A and B. Report the share
strictly over 100 ms, nearest-rank pooled p95 and p99, and the number of >100 ms
repeat `/tasks` → `/projects/project-1` transitions (destination visit >1 within its
run). Compare matched pairs as well as pooled summaries. A consistently larger
branch tail across pairs and the pooled measures is a regression warning: report it
plainly and stop before checkpoint-2 sign-off; propose changes, do not chase a pass.
Mixed or close results are inconclusive. Three runs per side cannot prove a regression
either way under the earlier six-run diagnostic reading rule. This smaller monitor
is expressly owner-requested and is neither acceptance nor evidence of no regression.
Acceptance stays at the end of G3 under Q15, without changing strict p95 <100 ms.

## Review diagnostic protocol (2026-10-24)

This protocol and the follow-up profile declaration were first committed with the
results in `5df3502` (2026-10-25 00:29 +08), after A1–C6 ran from 2026-10-24
15:55:29Z to 16:00:21Z. There is no prior committed protocol for these runs.
Future diagnostic protocols must be committed before the runs.

These are diagnostics, not replacement acceptance runs. A = unchanged main at `d16fe58`;
B = reviewed branch at `a05cffc`; C = that branch e2e build with test-only write probe
and inspection removed by a test build transform, without changing app source/behavior.
Use the same machine, 1,000 tasks, 4× CPU, resolved Auth/data/fonts/lazy modules,
trusted clicks and two-frame paint measurement. Browser tracing stays off for A/B/C.
Use an isolated main checkout, leave its speed spec unchanged, and immediately copy its
fixed `test-results/gate-2/speed-*.json` outputs into separate G3 per-run directories.
Retain original files as well as derived summaries; no run is overwritten or discarded.

Interpretation: for each side, pool ALL diagnostic samples and report the share
strictly over 100 ms, nearest-rank pooled p95 and p99, and the count of slow repeat
`/tasks` → `/projects/project-1` transitions (destination visited earlier in that run).
Also keep run-level p95/median/max, route-pair counts and every slow transition.
Fewer than SIX runs per side cannot prove a regression either way. Six is a minimum
for this comparison, not proof by itself: pooled samples within runs are correlated,
and machine/session/order effects remain possible. Do not pool for an acceptance gate.

Sequence: A1 B1 A2 B2 A3 B3 A4 B4 A5 B5 A6 B6, then six C runs. A/B are interleaved;
C's later timing is an order confound, to report explicitly. Keep unique side/run
directories and a manifest with revisions/build options and exact order. Use normal
branch instrumentation for B. Build C by removing write-test-probe loading and the
observer inspect hook in an in-memory e2e test transform; prove those modules/hooks
are absent from C's graph/output. Never use C as acceptance evidence.

After untraced runs, separately profile repeat `/tasks` → project transitions using
CDP timeline/long-task and GC observations, retaining trace events and scripting versus
rendering intervals around each slow repeat transition. Profiled timing is diagnostic
only and does not replace untraced samples. Report findings and propose changes;
do not apply app optimizations or start step 5.

Q15 now requires a passing unchanged-main baseline immediately before acceptance in
the same session. The earlier branch-only run below lacks that baseline; retain its
threshold results but do not claim acceptance under Q15. New diagnostics remain
diagnostics even when a main run passes. No acceptance rerun is planned in this review.

## Reviewer-reported results (not measured by this agent)

Same-machine back-to-back reviewer observations: branch full-e2e p95 114.1/106.8/106.7 ms,
then branch 129.2/111.5/102.4 ms; G2 main 98.3/104.5/106.1 ms and 92.3/100.0/98.4 ms.
Branch failed the strict threshold 6/6; main 3/6; 100.0 ms fails `<100 ms`.
Reported medians match at 69–80 ms. Of 32 slow branch samples, 15 were `/tasks` →
project, including 11 repeats; main had 1 of 7 slow samples on that route pair.
These are owner-supplied review results; raw reviewer samples were not supplied here.

Follow-up profile declaration (2026-10-25): the first fixed 120-click
trace captured no >100 ms repeat project transition (59 repeats; max 84.9 ms). Keep it.
Run ONE additional fixed 600-click B profile at the same 4× CPU, without app changes,
forced GC, synthetic CPU contention or threshold changes. Its test timeout allows the
longer trace only; the 90 s emulator deadline and all acceptance thresholds stay unchanged.
Do not repeat again to obtain a preferred result; report any missing reproduction.

## Review diagnostic results (2026-10-25)

[Manifest and exact order](speed-review-UrhkFS/manifest.json): A1 B1 A2 B2 A3 B3 A4 B4
A5 B5 A6 B6, then C1–C6. Each run has its original `samples.json` and `command.json`.
[Derived summary](speed-review-UrhkFS/summary.json) adds per-pair counts and sequence/
destination-visit annotations for every slow sample, including older main output.
All 1,080 samples are retained. No navigation-attributed requests on any side.
All runs are DIAGNOSTIC ONLY: no Q15 acceptance pass/fail is claimed for the branch.

| Side | Runs / samples | >100 ms | Pooled share | Pooled p95 ms | Pooled p99 ms | Slow repeat tasks→project |
|---|---:|---:|---:|---:|---:|---:|
| A: unchanged main | 6 / 360 | 33 | 9.17% | 107.6 | 155.4 | 8 |
| B: reviewed branch | 6 / 360 | 35 | 9.72% | 106.2 | 155.6 | 8 |
| C: branch without probe/inspect | 6 / 360 | 1 | 0.28% | 64.1 | 95.0 | 0 |

| Pair | A median / p95 / max ms | B median / p95 / max ms | A / B slow samples |
|---|---|---|---:|
| 1 | 85.40 / 101.2 / 268.7 | 85.15 / 115.4 / 185.5 | 4 / 12 |
| 2 | 82.35 / 117.4 / 155.4 | 86.10 / 102.1 / 139.8 | 7 / 6 |
| 3 | 83.05 / 100.9 / 137.2 | 82.80 / 104.7 / 206.6 | 4 / 8 |
| 4 | 89.60 / 128.0 / 156.5 | 64.10 / 124.1 / 175.6 | 17 / 7 |
| 5 | 53.75 / 66.9 / 95.9 | 51.70 / 72.4 / 103.1 | 0 / 1 |
| 6 | 52.05 / 62.5 / 113.4 | 52.95 / 68.9 / 110.9 | 1 / 1 |

| C run | Median / p95 / max ms | Slow samples |
|---|---|---:|
| 1 | 54.20 / 65.2 / 90.0 | 0 |
| 2 | 51.60 / 59.9 / 119.3 | 1 |
| 3 | 49.75 / 58.3 / 95.2 | 0 |
| 4 | 52.15 / 63.5 / 95.0 | 0 |
| 5 | 50.25 / 67.7 / 97.6 | 0 |
| 6 | 49.05 / 66.1 / 94.9 | 0 |

Per-pair total/slow counts over six runs: A `/→tasks` 120/19, `tasks→project` 120/11,
`project→/` 120/3; B 120/18, 120/12, 120/5 respectively; C 120/1, 120/0, 120/0.
A1–A4 main baselines exceed the threshold. A5–A6 being faster does not erase them.
Six runs per side meet the protocol's minimum, but their samples are clustered and
nonstationary. Main and branch tails are close here; the reviewer's concentration of
extra branch repeat-project outliers was not reproduced in this interleaved session.
This does NOT prove absence of a regression.

Both A and B sped up sharply before C. C's lower tail therefore cannot be attributed
to removing instrumentation: its later order is a material confound. The C build used
an in-memory test transform; no app source was edited. [Build proof](speed-review-UrhkFS/builds/C/build-proof.json)
shows one probe-load removal, one probe-install removal, both inspect removals, and no
probe module/marker/inspect in emitted app chunks. All builds used the same explicit
fake demo Firebase variables and empty envDir, with the same existing dependencies.

### Separately traced repeat-project profiles

Both profiles alternate `/tasks` and `/projects/project-1` only; the speed test uses
the three-route loop `/` → `/tasks` → `/projects/project-1` → `/`.

First: [120 windows](speed-review-UrhkFS/profile/summary.json), 59 repeat project visits,
maximum 84.9 ms; no slow repeat task → project transition was captured. Complete [Chrome trace](speed-review-UrhkFS/profile/timeline.json.gz).
The single fixed longer profile retained [600 windows](profile-review-TQtYai/profile/summary.json)
and its complete [Chrome trace](profile-review-TQtYai/profile/timeline.json.gz).
It captured one slow repeat task → project transition: sequence 298 (project visit 149), **118.9 ms**, overlapping
a **75 ms Long Tasks API entry** and a **75.551 ms renderer RunTask** in the trace.

For that marker-bounded window, exclusive recognized spans were 20.399 ms scripting,
24.132 ms rendering and 0 ms GC; 74.206 ms remained unclassified by those categories.
No GC event was observed in that window, including other threads. Inclusive scripting
was 30.389 ms and overlaps rendering; it must not be added to the rendering total.
Trace markers span 118.737 ms; their small endpoint difference from the 118.9 ms paint
measurement is retained, not normalized away. Unclassified time includes work/waits
outside the selected event categories; it is NOT proof of idle time or an OS cause.
The trace establishes a long main-thread task, not the responsible component or the
cause of the earlier reviewer/session tail. No optimization has been applied.

The other slow window was **#57**, a repeat `/projects/project-1` → `/tasks`
transition at **184.1 ms**, overlapping a **54 ms Long Tasks API entry**.

Propose, for review only: balanced/randomized B/C order with main controls, and a bounded
CPU-sampling/scheduler profile when a slow baseline reproduces, to resolve unclassified
time and distinguish browser scheduling from app scripting/layout. Preserve these runs.
Do not turn diagnostic pooling, C's variant, or a later fast subset into acceptance.

The first review startup [failed before any speed samples](speed-review-RZFgI1/startup-failure.json)
at the unchanged 90 s deadline (first output 70,357 ms). The separately traced second
startup completed; CLI tracing overhead is a shared diagnostic-session condition.
All startup attempts and all timing runs are retained; no threshold was relaxed.

## Original branch-only measurements (retained)

Original browser run: `emulator-Vltibv`, retries 0. No further navigation run
was made to replace these results. Browser tracing off; 1,000 emulator tasks, 4× CPU,
Auth/data/fonts/session-lazy modules resolved first. Existing trusted click → committed
view/rows → two-frame paint measurement; nearest-rank p95 (fourth-largest of 60).
Strict per-run p95 <100 ms; no per-pair or maximum-sample gate was added.

| Run | Samples | Median ms | p95 ms | Max ms | >100 ms | Navigation-attributed requests |
|---|---:|---:|---:|---:|---:|---:|
| 1 | 60 | 72.00 | 97.80 | 138.90 | 3 | 0 |
| 2 | 60 | 71.85 | 93.60 | 167.60 | 3 | 0 |
| 3 | 60 | 69.15 | 94.90 | 146.60 | 3 | 0 |

All three satisfy the numeric threshold; none is Q15-qualified acceptance. Registrations
stay three; no route-caused new channel or data reset.
All raw samples, windows, idle traffic, outside-window requests and attribution remain:
[run 1](emulator-Vltibv/speed-1.json), [run 2](emulator-Vltibv/speed-2.json),
[run 3](emulator-Vltibv/speed-3.json). Each sample includes sequence and destination-visit
number; the initial Dashboard is already visited once when timing starts.

## Counts per route pair (total / over 100 ms)

| Route pair | Run 1 | Run 2 | Run 3 |
|---|---:|---:|---:|
| / → /tasks | 20 / 2 | 20 / 1 | 20 / 2 |
| /tasks → /projects/project-1 | 20 / 1 | 20 / 1 | 20 / 1 |
| /projects/project-1 → / | 20 / 0 | 20 / 1 | 20 / 0 |

## Every transition over 100 ms

| Run | Sequence | Route pair | Destination visit | ms |
|---|---:|---|---:|---:|
| 1 | 1 | / → /tasks | 1 | 138.90 |
| 1 | 2 | /tasks → /projects/project-1 | 1 | 104.50 |
| 1 | 25 | / → /tasks | 9 | 120.80 |
| 2 | 1 | / → /tasks | 1 | 167.60 |
| 2 | 2 | /tasks → /projects/project-1 | 1 | 118.00 |
| 2 | 30 | /projects/project-1 → / | 11 | 107.10 |
| 3 | 1 | / → /tasks | 1 | 146.60 |
| 3 | 43 | / → /tasks | 15 | 108.60 |
| 3 | 44 | /tasks → /projects/project-1 | 15 | 120.90 |

The smallest p95 margin is 2.2 ms. Repeat-project latency above 100 ms still occurs;
these numeric results do not prove the cause of G2's retained 104.8 ms p95 failure or remove
the carried risk. No sample was discarded or pooled to hide a failure.

If the strict gate fails later, preserve that run first. Separately label diagnostic
browser tracing, long tasks, render/layout/GC and request/channel observations; compare
first/repeat visits, selector recomputation, row stability, virtualization and frame
publication. Establish a concrete cause/change before another acceptance run, retaining
both results. Diagnostic samples never replace untraced acceptance samples.
