# Phase-1 route diagnostic protocol (2026-11-02)

This protocol and the harness changes must be committed before the first run.
This is the requested WriteUI main/branch diagnostic, not Q14 timing, Q15 acceptance
or gate closeout. No additional profile, no-probe variant or acceptance session.

- A: unchanged current `origin/main` (`d16fe58910dd35379f5e535796857e3ba21d82a5`
  at preparation), in the existing clean isolated checkout. Recheck the fetched ref,
  clean tree and exact hash before building. No dependency install or main edit.
- B: committed gate branch after all phase-1 app fixes; record its exact head.
  Reject uncommitted app, tests or rules changes. Freeze app/test source for the session.
- Chrome: owner confirmed it closed. Verify zero `chrome.exe` processes before
  starting, and before/after every run; record counts/timestamps. Stop on a nonzero
  count and retain the interrupted session; never terminate the owner's browser.
- Order **A1 B1 A2 B2 A3 B3**, with unchanged main first and three runs per side.
  Run all six once regardless of numeric outcome. No rerun to get a passing p95.
- Use the existing emulator harness, identical explicit demo Firebase configuration,
  empty envDir, existing dependencies, e2e builds, resolved Auth/data/fonts/lazy modules,
  1,000 tasks, virtualization, 4× CPU, trusted clicks, tracing off and two-frame metric.
  Each run uses 60 transitions in the existing three-route loop.
- Use `node tests/diagnostics/run-checkpoint2-monitor.mjs --phase1`. A unique
  `docs/qa/gate-3/phase1-speed-*` session holds build provenance and A1–B3 directories.
  Main's spec writes fixed `test-results/gate-2/speed-1.json`: copy it immediately
  after EACH run, including failures, with a freshness check. No G2 repo evidence edits.

## Reading the results

Report per side: pooled share of samples **over 100 ms**, pooled nearest-rank p95
and p99, and count of slow repeat `/tasks` → `/projects/project-1` transitions
(`destinationVisit > 1`). Report each run's sample count, median/p95/max, every
route-pair count and every >100 ms sample with sequence/routes/first-or-repeat.
Retain every sample, command outcome/failure and request/transport/listener record.

Fewer than six runs per side cannot prove a regression either way. These three-run
pooled readings are exploratory and do not replace individual strict `p95 < 100 ms`
results or Q15's later qualifying-baseline requirement. Do not pool to hide failures.
Do not invent a comparative pass threshold. This A/B compares whole main and G3
builds; it cannot isolate a causal WriteUI improvement. The component tests separately
check that ordinary route changes do not render the write subtree.

Keep navigation-request attribution separate from existing Firestore transport;
no blanket exclusion. No code tuning in response to the diagnostic. Run the requested
final-head full suite, retain failures, report findings and stop for owner recheck.
