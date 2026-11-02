# Phase-1 retained speed evidence (2026-11-02)

## Requested interleaved diagnostic

Protocol and harness mode committed in **5fd18d2** before runs. Completed session:
[manifest](phase1-speed-olTMAH/manifest.json), [summary](phase1-speed-olTMAH/summary.json).
A = clean unchanged main **d16fe58910dd35379f5e535796857e3ba21d82a5**;
B = branch **7adfd6df0047bc5b03cd6ca352b08b6aa1a49e45**.
Order **A1 B1 A2 B2 A3 B3**, separate output directory for every run. Main's fixed
speed-1 output was freshness-checked and copied after each run. All six commands
exit 0; no samples overwritten. No G2 repository evidence changed.

The earlier [zero-sample abort](phase1-speed-8gWS1k/failure.json) is retained:
Chrome processes remained after the visible window closed. Only after the owner's
explicit permission, zero visible windows were rechecked and installed background
Chrome processes ended. The completed session records **13 zero-process checks**
(start, before/after each run). No process was ended before that answer.

Conditions: existing emulator harness and dependencies, identical explicit fake
Firebase config and empty envDir on both sides, e2e builds, 1,000 tasks, virtualization,
4? CPU, resolved Auth/data/fonts/lazy modules, trusted clicks, tracing off, established
two-frame commit/paint metric. The usual three-route loop supplies 60 samples/run.
These builds differ in Firebase configuration from the local-.env normal bundle.

### Predeclared pooled reading

| Side | Runs / samples | >100 ms | Share >100 ms | Pooled p95 ms | Pooled p99 ms | Slow repeat tasks ? project |
|---|---|---|---|---|---|---|
| Main A | 3 / 180 | 1 | 0.56% | 59.8 | 94.3 | 0 |
| Branch B | 3 / 180 | 1 | 0.56% | 64.1 | 99.0 | 0 |

Branch pooled p95/p99 are numerically **4.3 / 4.7 ms higher**, with the same slow
share and no slow repeat project transitions on either side. Fewer than six runs
per side cannot prove a regression either way. This compares whole G2/G3 builds,
not a causal WriteUI-only effect; component tests separately check render behavior.
Do not call it proof of no regression or a resolved G2 speed-margin risk.

### Every run

Medians displayed to two decimals; original floating-point values remain in raw JSON.
Each nearest-rank p95 is strictly under 100 ms. This is **diagnostic, not Q15 acceptance**.
No Q14 Quick Add timing, acceptance baseline/runs, extra profile or no-probe variant.

| Run | Samples | Median ms | p95 ms | Max ms | >100 ms | Evidence |
|---|---|---|---|---|---|---|
| A1 | 60 | 46.95 | 57.1 | 90.3 | 0 | [raw](phase1-speed-olTMAH/A1/samples.json) |
| B1 | 60 | 51.3 | 63.2 | 102 | 1 | [raw](phase1-speed-olTMAH/B1/samples.json) |
| A2 | 60 | 47 | 65.6 | 112.4 | 1 | [raw](phase1-speed-olTMAH/A2/samples.json) |
| B2 | 60 | 51.5 | 60.8 | 99 | 0 | [raw](phase1-speed-olTMAH/B2/samples.json) |
| A3 | 60 | 46.85 | 56.6 | 94.3 | 0 | [raw](phase1-speed-olTMAH/A3/samples.json) |
| B3 | 60 | 53.6 | 72.3 | 95.6 | 0 | [raw](phase1-speed-olTMAH/B3/samples.json) |

### Every route-pair count

| Run | Actual route pair | Total | >100 ms |
|---|---|---|---|
| A1 | / ? /tasks | 20 | 0 |
| A1 | /tasks ? /projects/project-1 | 20 | 0 |
| A1 | /projects/project-1 ? / | 20 | 0 |
| B1 | / ? /tasks | 20 | 1 |
| B1 | /tasks ? /projects/project-1 | 20 | 0 |
| B1 | /projects/project-1 ? / | 20 | 0 |
| A2 | / ? /tasks | 20 | 0 |
| A2 | /tasks ? /projects/project-1 | 20 | 0 |
| A2 | /projects/project-1 ? / | 20 | 1 |
| B2 | / ? /tasks | 20 | 0 |
| B2 | /tasks ? /projects/project-1 | 20 | 0 |
| B2 | /projects/project-1 ? / | 20 | 0 |
| A3 | / ? /tasks | 20 | 0 |
| A3 | /tasks ? /projects/project-1 | 20 | 0 |
| A3 | /projects/project-1 ? / | 20 | 0 |
| B3 | / ? /tasks | 20 | 0 |
| B3 | /tasks ? /projects/project-1 | 20 | 0 |
| B3 | /projects/project-1 ? / | 20 | 0 |

### Every transition over 100 ms

| Run | Sequence | Actual routes | Duration ms | Destination visit |
|---|---|---|---|---|
| B1 | 1 | / ? /tasks | 102 | first |
| A2 | 6 | /projects/project-1 ? / | 112.4 | repeat (3) |

All 360 timing windows have zero request starts, zero navigation-attributed requests,
zero console errors, and three active handles/registrations before and after each
run. Raw records retain existing in-flight Firestore channels and outside-window
requests separately. No blanket Firestore exclusion or sample pooling hides a failure.

## Final full-suite navigation runs

Source **7adfd6d**, full e2e **66 passed**, new **180** raw samples. Chrome count
before e2e was 0. No app/test change between the diagnostic and this invocation.
Existing 1,000-task / 4? CPU / trusted-click / untraced protocol, separate from
the A/B results above. No acceptance claim or immediately preceding acceptance baseline.

| Run | Samples | Median ms | p95 ms | Max ms | >100 ms | Evidence |
|---|---|---|---|---|---|---|
| 1 | 60 | 48.85 | 57.5 | 92.2 | 0 | [raw](emulator-nr3Mb0/speed-1.json) |
| 2 | 60 | 48.5 | 56.8 | 90.4 | 0 | [raw](emulator-nr3Mb0/speed-2.json) |
| 3 | 60 | 50.05 | 60.2 | 93.5 | 0 | [raw](emulator-nr3Mb0/speed-3.json) |

| Run | Actual route pair | Total | >100 ms |
|---|---|---|---|
| 1 | / ? /tasks | 20 | 0 |
| 1 | /tasks ? /projects/project-1 | 20 | 0 |
| 1 | /projects/project-1 ? / | 20 | 0 |
| 2 | / ? /tasks | 20 | 0 |
| 2 | /tasks ? /projects/project-1 | 20 | 0 |
| 2 | /projects/project-1 ? / | 20 | 0 |
| 3 | / ? /tasks | 20 | 0 |
| 3 | /tasks ? /projects/project-1 | 20 | 0 |
| 3 | /projects/project-1 ? / | 20 | 0 |

**No >100 ms transitions** in any of these three runs; none discarded. Each p95
is strictly below 100 ms. Zero request starts/navigation-attributed requests and
console errors in all 180 windows; exactly three active handles and registrations
before/after each run. Existing transport and outside-window requests remain in raw files.

Total new timing samples: **540** (360 diagnostic + 180 full suite). The aborted
Chrome-condition session produced zero. No extra diagnostic or unchanged-code rerun
was used to obtain these results. Prior failures and G2 thin-margin risk remain retained.
