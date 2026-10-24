# G3 evidence

- [Checkpoint 2](CHECKPOINT-2.md): integrated CRUD, Q17 pending-only guard, ran/read
  record, proposed rules diff and owner handoff. Rules remain unchanged.
- [Paired checkpoint-2 monitor](checkpoint2-monitor-VNDDJq/summary.json): all 360
  samples retained; diagnostic monitor only, not Q15 acceptance. Protocol committed
  in `4181103` before runs. [Rollout actions (a)–(f)](ROLLOUT.md) remain owner-UNVERIFIED.
- [Checkpoint 1 and review revision](CHECKPOINT-1.md): scope, per-item ran/read record,
  SDK outcomes, environment-specific bundles and owner stop points.
- [Speed interpretation and results](SPEED-CHECKPOINT-1.md): diagnostic protocol and provenance,
  reviewer-reported numbers, all sessions, per-side pooled statistics and trace findings.
- [Activity contract](ACTIVITY-CONTRACT.md): Q16 keeps “Completed {task}”; known G4
  design deviation remains in the frame.

Main's unchanged speed spec writes fixed `test-results/gate-2/speed-*.json` paths.
Every baseline comparison MUST copy output after EACH run into a separate directory.
The review harness does this in an isolated unchanged-main checkout, with a freshness
check so a failed test cannot silently copy a previous run. No G2 evidence in this repo
is rewritten. A1–A6, B1–B6 and C1–C6 each retain original samples and command output
under [speed-review-UrhkFS](speed-review-UrhkFS/manifest.json).

Reproduction (existing dependencies only): `node tests/diagnostics/run-speed.mjs` after
creating its isolated `test-results/gate-3/review-main` checkout at `d16fe58`.
The harness builds A/B/C with the same fake demo config, runs the declared interleaving,
copies each result, then takes a separate trace. It never changes app source.
`node tests/diagnostics/analyze-speed.mjs <directory>` derives pooled and trace summaries.
The separately declared 600-click profile is recorded in `profile-review-TQtYai`;
its retained command uses the old 60-cycle title, but the requested/captured count is
600 and all 600 windows are present. The current test title is length-neutral.
For a fresh reproduction, pass that session's B build explicitly:
`node tests/diagnostics/run-profile.mjs <session>/builds/B/dist`.

Generated Playwright error-context Markdown exceeding 300 lines is retained losslessly
as `error-context.json` (originalMarkdown field); original bytes are also copied into
ignored `test-results/gate-3/review-aux/`. Timing samples are never reformatted by this step.

Chrome traces are complete gzip-compressed JSON; decompress to import in DevTools.
No trace data, timing failure, or earlier session is replaced by a later pass.
