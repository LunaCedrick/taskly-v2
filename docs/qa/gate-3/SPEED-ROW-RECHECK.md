# Retained row-recheck route measurements (2026-10-31)

Two full-suite invocations, **360 raw transitions**, each in a unique directory.
A is source **bae7308**; B is source **2183186**. B's full e2e fails three
phone virtual-list resize checks; A's 54 tests pass. Both results are retained.
The source change between them retains measured row indices and adds a missing-index
warning assertion. A later targeted geometry attempt has no navigation measurements.

These are the existing three-run speed checks inside full e2e, not additional
diagnostics or Q15 acceptance. Neither invocation has an immediately preceding
qualifying unchanged-main baseline. Under Q15 these sessions count as neither a
branch acceptance pass nor fail. No pooled result replaces individual p95s, no
unchanged-code rerun chases a pass, and no main comparison/regression claim is made.

Conditions: Windows 10, Ryzen 5 3400G / 8 logical CPUs, Chromium 156.0.8078.4,
Node 24.16.0; existing emulator e2e build, 1,000 tasks, virtualization enabled,
4? CPU throttle, trusted clicks, two-frame commit/paint measurement, tracing off.
Session data/fonts/lazy modules settle before timing. The loop is Dashboard ?
My Tasks ? project-1 ? Dashboard, 20 times (60 transitions per run).

## Per-run numeric results

All six nearest-rank p95 values are strictly below 100 ms. These numeric results
are separate from acceptance eligibility and the failing B resize tests.

| Run | Samples | Median ms | p95 ms | Max ms | >100 ms | Navigation requests | Evidence |
|---|---|---|---|---|---|---|---|
| A1 | 60 | 62.3 | 86.9 | 120.9 | 1 | 0 | [raw](emulator-UqYG7H/speed-1.json) |
| A2 | 60 | 57.85 | 75.1 | 108.8 | 1 | 0 | [raw](emulator-UqYG7H/speed-2.json) |
| A3 | 60 | 60.3 | 83 | 112 | 2 | 0 | [raw](emulator-UqYG7H/speed-3.json) |
| B1 | 60 | 54.55 | 68.5 | 98.5 | 0 | 0 | [raw](emulator-jQaXSl/speed-1.json) |
| B2 | 60 | 52.1 | 65.6 | 97 | 0 | 0 | [raw](emulator-jQaXSl/speed-2.json) |
| B3 | 60 | 52.4 | 70 | 94.4 | 0 | 0 | [raw](emulator-jQaXSl/speed-3.json) |

## Every route-pair count

| Run | Actual route pair | Total | >100 ms |
|---|---|---|---|
| A1 | / ? /tasks | 20 | 1 |
| A1 | /tasks ? /projects/project-1 | 20 | 0 |
| A1 | /projects/project-1 ? / | 20 | 0 |
| A2 | / ? /tasks | 20 | 1 |
| A2 | /tasks ? /projects/project-1 | 20 | 0 |
| A2 | /projects/project-1 ? / | 20 | 0 |
| A3 | / ? /tasks | 20 | 2 |
| A3 | /tasks ? /projects/project-1 | 20 | 0 |
| A3 | /projects/project-1 ? / | 20 | 0 |
| B1 | / ? /tasks | 20 | 0 |
| B1 | /tasks ? /projects/project-1 | 20 | 0 |
| B1 | /projects/project-1 ? / | 20 | 0 |
| B2 | / ? /tasks | 20 | 0 |
| B2 | /tasks ? /projects/project-1 | 20 | 0 |
| B2 | /projects/project-1 ? / | 20 | 0 |
| B3 | / ? /tasks | 20 | 0 |
| B3 | /tasks ? /projects/project-1 | 20 | 0 |
| B3 | /projects/project-1 ? / | 20 | 0 |

## Every transition over 100 ms

Visit counts refer to the destination within the recorded loop; the Dashboard
already exists at its start. No >100 ms transitions occur in B, or on the
/tasks ? project pair in either invocation (including repeat project visits).

| Run | Sequence | Actual routes | Duration ms | Destination visit |
|---|---|---|---|---|
| A1 | 1 | / ? /tasks | 120.9 | first |
| A2 | 1 | / ? /tasks | 108.8 | first |
| A3 | 1 | / ? /tasks | 109.3 | first |
| A3 | 16 | / ? /tasks | 112 | repeat (6) |

## Transport, lifecycle and retained evidence

Across all 360 timing windows: **zero request starts**, zero navigation-attributed
requests and zero console errors. Each run records exactly three active handles
and three registrations before and after navigation. Existing Firestore Listen
backchannels already in flight before clicks are retained separately in the raw
windows; they are not new route requests. Other startup/outside-window requests
remain in each file. Nothing is excluded by a blanket Firestore filter.

Full command manifests/logs: [A](row-layout-recheck/final-suite.json),
[B](row-layout-recheck/verified-suite.json). The G2 thin-margin risk and all earlier
failed/reviewer runs remain in their existing reports; these faster local results
do not prove that risk resolved. Production first-data latency remains UNVERIFIED.
