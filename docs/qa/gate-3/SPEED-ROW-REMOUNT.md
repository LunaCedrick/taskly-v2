# Retained bounded-remount route measurements (2026-10-31)

Source **0541208**; one full e2e invocation, **54 passed**, with the existing three
60-click speed checks. This follows the single remount attempt's passing targeted
row spec; no fallback, further app iteration, profile, A/B diagnostic or extra speed
run was performed. [Full command manifest](row-remount-0GEweP/full-suite.json).

These are **not Q15 acceptance runs**: no immediately preceding qualifying
unchanged-main baseline was run. This session counts as neither an acceptance pass
nor fail. Numeric results remain separate from acceptance eligibility; no pooling,
discarded samples or regression inference. All prior failures/results remain in
[the earlier row report](SPEED-ROW-RECHECK.md) and older checkpoint reports.

Conditions: 1,000 emulator tasks, virtualization on, 4? CPU, Chromium 156.0.8078.4,
Windows 10 / Ryzen 5 3400G / 8 logical CPUs, Node 24.16.0. Resolved Auth/data/fonts/
lazy modules, trusted clicks, tracing off, established two-frame commit/paint metric.
Twenty Dashboard ? My Tasks ? project-1 ? Dashboard loops per run.

## Per-run numeric results

Each nearest-rank p95 is strictly below 100 ms. Medians displayed to one decimal;
raw values and all **180** sequence/source/destination/visit/duration samples remain.

| Run | Samples | Median ms | p95 ms | Max ms | >100 ms | Evidence |
|---|---|---|---|---|---|---|
| 1 | 60 | 68.3 | 87.5 | 147 | 2 | [raw](emulator-BDlWFa/speed-1.json) |
| 2 | 60 | 70.2 | 85.6 | 125.2 | 1 | [raw](emulator-BDlWFa/speed-2.json) |
| 3 | 60 | 68.3 | 83.9 | 130 | 2 | [raw](emulator-BDlWFa/speed-3.json) |

## Every route-pair count

| Run | Actual route pair | Total | >100 ms |
|---|---|---|---|
| 1 | / ? /tasks | 20 | 1 |
| 1 | /tasks ? /projects/project-1 | 20 | 1 |
| 1 | /projects/project-1 ? / | 20 | 0 |
| 2 | / ? /tasks | 20 | 1 |
| 2 | /tasks ? /projects/project-1 | 20 | 0 |
| 2 | /projects/project-1 ? / | 20 | 0 |
| 3 | / ? /tasks | 20 | 1 |
| 3 | /tasks ? /projects/project-1 | 20 | 1 |
| 3 | /projects/project-1 ? / | 20 | 0 |

## Every transition over 100 ms

| Run | Sequence | Actual routes | Duration ms | Destination visit |
|---|---|---|---|---|
| 1 | 1 | / ? /tasks | 147 | first |
| 1 | 2 | /tasks ? /projects/project-1 | 115.9 | first |
| 2 | 1 | / ? /tasks | 125.2 | first |
| 3 | 1 | / ? /tasks | 130 | first |
| 3 | 2 | /tasks ? /projects/project-1 | 106.7 | first |

All five slow transitions are first visits; slow repeat /tasks ? project-1 count
is **0**. This does not establish that G2's thin repeat-project margin is resolved.
No unchanged-main comparison or new diagnostic was run.

## Transport and lifecycle

Zero request starts in all 180 click-to-paint windows, zero navigation-attributed
requests and zero console errors. Three active handles and three registrations
before and after each run. Raw windows retain already in-flight Firestore Listen
backchannels separately, plus startup/outside-window traffic. No blanket Firestore
exclusion is used. Production first-data latency remains UNVERIFIED and deferred.
