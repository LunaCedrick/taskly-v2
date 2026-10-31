# One bounded remount attempt (2026-10-31)

Owner authorization: docs/decisions/g3.md Q22. Baseline app/test source: 2183186.
Remount only virtualized Project lists on changes of the existing CSS layout mode.
Remove the in-place cache reset; no measureElement override. Focused/revealed range logic remains.
First: existing g3-row-layout spec at 320/360/390/1280, both list modes, keeping the specific missing-index warning assertion.
Added observations record scroll position, DOM focus and the roving tab stop across each breakpoint.
Then: full build/lint/typecheck/unit/rules/e2e suite; ordinary speed results are not Q15 acceptance.
On any attempt failure: no iteration; restore app source to bae7308, keep tests, document only the specified warning limitation, run full suite and stop.
No deployments, rule edits, dependencies, extra diagnostics or acceptance runs. All outputs retained.

The original attempt.diff is retained losslessly as attempt.diff.gz (including blank diff-context spaces).
