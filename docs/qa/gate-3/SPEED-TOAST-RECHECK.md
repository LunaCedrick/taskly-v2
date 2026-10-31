# Route samples from the toast recheck (2026-10-31)

Source `d03acb1`; full e2e `emulator-6RYrlz`: 46 passed. Existing speed spec,
1,000 tasks, 4? CPU, tracing off, 60 trusted transitions per run. All 180 original
samples are retained. No immediately preceding unchanged-main baseline: these are
numeric results from the required full suite, **not Q15 acceptance**. No reruns of
unchanged code to chase speed, extra profiling, new metrics or relaxed thresholds.

Each run keeps the strict nearest-rank `p95 < 100 ms`; results are not pooled to pass.

| Run | Samples | Median ms | p95 ms | Max ms | >100 ms | Navigation requests |
|---|---|---|---|---|---|---|
| 1 | 60 | 62.150000000000006 | 85.2 | 141.6 | 2 | 0 |
| 2 | 60 | 57.25 | 81.1 | 121 | 1 | 0 |
| 3 | 60 | 58.7 | 74.1 | 104.1 | 1 | 0 |

Every route pair, per run:

| Run | From ? to | Samples | >100 ms |
|---|---|---|---|
| 1 | / -> /tasks | 20 | 1 |
| 1 | /tasks -> /projects/project-1 | 20 | 1 |
| 1 | /projects/project-1 -> / | 20 | 0 |
| 2 | / -> /tasks | 20 | 1 |
| 2 | /tasks -> /projects/project-1 | 20 | 0 |
| 2 | /projects/project-1 -> / | 20 | 0 |
| 3 | / -> /tasks | 20 | 1 |
| 3 | /tasks -> /projects/project-1 | 20 | 0 |
| 3 | /projects/project-1 -> / | 20 | 0 |

Every transition over 100 ms (no omissions):

| Run | Sequence | From ? to | ms | Destination visit |
|---|---|---|---|---|
| 1 | 1 | / ? /tasks | 141.6 | 1 (first) |
| 1 | 2 | /tasks ? /projects/project-1 | 103 | 1 (first) |
| 2 | 1 | / ? /tasks | 121 | 1 (first) |
| 3 | 1 | / ? /tasks | 104.1 | 1 (first) |

Each run has zero navigation-attributed requests and zero captured console errors;
unchanged registrations and exactly three active handles. Established transport and
each click window remain in the raw JSON; no transport attribution is discarded.

Raw samples: [run 1](emulator-6RYrlz/speed-1.json), [run 2](emulator-6RYrlz/speed-2.json),
[run 3](emulator-6RYrlz/speed-3.json). Earlier G2/G3 failures remain retained in their
original evidence. This session does not establish a speed regression or its absence.
