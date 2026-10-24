# Checkpoint 1 navigation measurements

Normal acceptance browser run: `emulator-Vltibv`, retries 0. No further navigation run
was made to replace these results. Browser tracing off; 1,000 emulator tasks, 4× CPU,
Auth/data/fonts/session-lazy modules resolved first. Existing trusted click → committed
view/rows → two-frame paint measurement; nearest-rank p95 (fourth-largest of 60).
Strict per-run p95 <100 ms; no per-pair or maximum-sample gate was added.

| Run | Samples | Median ms | p95 ms | Max ms | >100 ms | Navigation-attributed requests |
|---|---:|---:|---:|---:|---:|---:|
| 1 | 60 | 72.00 | 97.80 | 138.90 | 3 | 0 |
| 2 | 60 | 71.85 | 93.60 | 167.60 | 3 | 0 |
| 3 | 60 | 69.15 | 94.90 | 146.60 | 3 | 0 |

All three runs pass. Registrations stay three; no route-caused new channel or data reset.
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
these passes do not prove the cause of G2's retained 104.8 ms p95 failure or remove
the carried risk. No sample was discarded or pooled to hide a failure.

If the strict gate fails later, preserve that run first. Separately label diagnostic
browser tracing, long tasks, render/layout/GC and request/channel observations; compare
first/repeat visits, selector recomputation, row stability, virtualization and frame
publication. Establish a concrete cause/change before another acceptance run, retaining
both results. Diagnostic samples never replace untraced acceptance samples.
