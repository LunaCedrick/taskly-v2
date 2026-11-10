# Phase-2 measurement protocol (2026-11-10)

Commit this protocol and the test-only harness before measuring. App behavior is
frozen after Q25; no app edits may follow acceptance without invalidating it.
Retain every invocation, startup failure, sample and per-run output.

## Q14 Quick Add

Use the existing isolated Auth/Firestore emulator runner. Initial fixture: 1,000
tasks. Resolved Auth, projects/tasks/activity, fonts and lazy session modules.
Chromium, 4× CPU, tracing off. Twenty valid trusted-Enter submissions: five per
Project view / My Tasks at each of 1280×900 and 390×844. Each task is added through
the actual UI → mutation → SDK local snapshot → frame-batched store → list path.
The task count grows from 1,000 to 1,020; no reset between samples.

Test-page instrumentation starts at captured Enter keydown, waits for the new
task's row to commit within its list viewport in rAF, then crosses that paint in
the next rAF. Record every duration without rounding before comparison, title,
route, width, ID and local-pending snapshot evidence. This is a two-frame paint
proxy, not a screenshot timestamp. Modal stays open; title clears and focus stays.
Acknowledgements settle between submissions, outside the timing window.
Every sample must be strictly <100 ms; no percentile, dropped sample or relaxed
threshold. Collect all 20 before the threshold assertion. A failure is reported,
not replaced. Instrumentation is test-only and absent from normal dist/graph.

## Q15 single acceptance session

Close Chrome and other heavy apps first. Record process/window counts, top CPU
and working-set processes, OS/CPU/RAM/free memory, time, tool versions and source
identities before the session; retain Chrome checks around the runs.
Use clean unchanged origin/main in its existing isolated checkout. Build both
sides with the same explicit fake demo Firebase config/empty envDir, emulators,
dependencies, settled Auth/data/fonts/lazy modules and 1,000 tasks.

One unchanged-main baseline of 60 trusted clicks immediately precedes three
branch runs of 60 clicks each. No intervening build/test/workload. Keep the
existing three-route loop, 4× CPU, tracing off, two-frame commit/paint metric,
request attribution and three-listener invariants. Each nearest-rank p95 must
be strictly <100 ms. Baseline failure makes the session invalid: retain/report
it as neither branch pass nor fail, do not start branch runs, and stop. Do not
repeat a session to replace a result. A branch failure remains a failure.

Each run has a unique directory; copy main's fixed gate-2 output immediately
with freshness verification. Report sample count, median/p95/max, every route
pair's count, every >100 ms transition and first/repeat visit. Retain transport
windows; no blanket exclusion. Pooling cannot substitute for per-run gates.
The three branch runs also satisfy the review skill's speed recheck. Any speed
runs in final full e2e remain separately labeled suite results, not acceptance.
