# Checkpoint 2 review: retained full-e2e speed results

Both full runs are retained; code changed for focus/sync correctness between them.
There was no immediately preceding main baseline, so neither is Q15 acceptance.
Strict per-run nearest-rank p95 <100 ms, 60 samples, 1,000 tasks, 4? CPU, tracing off.
No unchanged-code timing rerun or relaxed threshold. Cause of the tail is unproven.

| Source / run | Samples | Median / p95 / max ms | >100 ms | Numeric p95 |
|---|---:|---|---:|---|
| b56f8c8 / 1 | 60 | 79.05 / 97.2 / 164.4 | 2 | PASS |
| b56f8c8 / 2 | 60 | 74.55 / 96.5 / 130.5 | 3 | PASS |
| b56f8c8 / 3 | 60 | 78.25 / 98.5 / 146.2 | 3 | PASS |
| bb4f7a9 / 1 | 60 | 73.35 / 106.9 / 162 | 5 | FAIL |
| bb4f7a9 / 2 | 60 | 77.20 / 111 / 154.1 | 5 | FAIL |
| bb4f7a9 / 3 | 60 | 74.40 / 101.8 / 159.1 | 5 | FAIL |

All per-route-pair counts (total / >100 ms):

| Source / run | Route pair | Total / slow |
|---|---|---:|
| b56f8c8 / 1 | / -> /tasks | 20 / 1 |
| b56f8c8 / 1 | /tasks -> /projects/project-1 | 20 / 1 |
| b56f8c8 / 1 | /projects/project-1 -> / | 20 / 0 |
| b56f8c8 / 2 | / -> /tasks | 20 / 1 |
| b56f8c8 / 2 | /tasks -> /projects/project-1 | 20 / 2 |
| b56f8c8 / 2 | /projects/project-1 -> / | 20 / 0 |
| b56f8c8 / 3 | / -> /tasks | 20 / 1 |
| b56f8c8 / 3 | /tasks -> /projects/project-1 | 20 / 2 |
| b56f8c8 / 3 | /projects/project-1 -> / | 20 / 0 |
| bb4f7a9 / 1 | / -> /tasks | 20 / 1 |
| bb4f7a9 / 1 | /tasks -> /projects/project-1 | 20 / 3 |
| bb4f7a9 / 1 | /projects/project-1 -> / | 20 / 1 |
| bb4f7a9 / 2 | / -> /tasks | 20 / 3 |
| bb4f7a9 / 2 | /tasks -> /projects/project-1 | 20 / 2 |
| bb4f7a9 / 2 | /projects/project-1 -> / | 20 / 0 |
| bb4f7a9 / 3 | / -> /tasks | 20 / 1 |
| bb4f7a9 / 3 | /tasks -> /projects/project-1 | 20 / 4 |
| bb4f7a9 / 3 | /projects/project-1 -> / | 20 / 0 |

Every transition over 100 ms (destination visit 1 = first, >1 = repeat):

| Source / run | Sequence | Route pair | Destination visit | ms |
|---|---:|---|---:|---:|
| b56f8c8 / 1 | 1 | / ? /tasks | 1 | 164.4 |
| b56f8c8 / 1 | 2 | /tasks ? /projects/project-1 | 1 | 122.2 |
| b56f8c8 / 2 | 1 | / ? /tasks | 1 | 130.5 |
| b56f8c8 / 2 | 2 | /tasks ? /projects/project-1 | 1 | 102.5 |
| b56f8c8 / 2 | 11 | /tasks ? /projects/project-1 | 4 | 106.6 |
| b56f8c8 / 3 | 1 | / ? /tasks | 1 | 146.2 |
| b56f8c8 / 3 | 2 | /tasks ? /projects/project-1 | 1 | 110.1 |
| b56f8c8 / 3 | 59 | /tasks ? /projects/project-1 | 20 | 101.9 |
| bb4f7a9 / 1 | 1 | / ? /tasks | 1 | 162 |
| bb4f7a9 / 1 | 2 | /tasks ? /projects/project-1 | 1 | 109.8 |
| bb4f7a9 / 1 | 18 | /projects/project-1 ? / | 7 | 106.9 |
| bb4f7a9 / 1 | 20 | /tasks ? /projects/project-1 | 7 | 110 |
| bb4f7a9 / 1 | 50 | /tasks ? /projects/project-1 | 17 | 105.1 |
| bb4f7a9 / 2 | 1 | / ? /tasks | 1 | 154.1 |
| bb4f7a9 / 2 | 2 | /tasks ? /projects/project-1 | 1 | 111 |
| bb4f7a9 / 2 | 4 | / ? /tasks | 2 | 103.8 |
| bb4f7a9 / 2 | 35 | /tasks ? /projects/project-1 | 12 | 118.5 |
| bb4f7a9 / 2 | 58 | / ? /tasks | 20 | 144.8 |
| bb4f7a9 / 3 | 1 | / ? /tasks | 1 | 159.1 |
| bb4f7a9 / 3 | 2 | /tasks ? /projects/project-1 | 1 | 118.1 |
| bb4f7a9 / 3 | 17 | /tasks ? /projects/project-1 | 6 | 101.6 |
| bb4f7a9 / 3 | 20 | /tasks ? /projects/project-1 | 7 | 101.8 |
| bb4f7a9 / 3 | 56 | /tasks ? /projects/project-1 | 19 | 101.8 |

Raw samples/requests/registrations: [first full run](checkpoint2-review-TNDzZx/browser/),
[final step-1 full run](checkpoint2-review-xbNmX1/browser/).
The final full-e2e result is 39 passed / 3 numeric speed failures. G3 remains incomplete.
