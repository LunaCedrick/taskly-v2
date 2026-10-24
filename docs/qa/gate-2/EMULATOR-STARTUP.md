# G2 emulator startup investigation — 2026-10-23

The shared spawn-to-usable-Auth-and-Firestore deadline remains **90,000 ms**. The project remains `demo-taskly-auth` (now a misnomer for combined tests), Auth 9099 and Firestore 8081. No unrelated service was reused or terminated; the checked-in Firebase configuration is unchanged.

| Attempt | Result | Evidence directory |
|---|---|---|
| Initial preflight | CLI `--version` subprocess exceeded its separate 10 s limit; no emulator process had started | `test-results/gate-2/emulator-QeLQ1z` |
| First actual CLI/emulator start | First output at 67,273 ms; neither service ready before the shared 90 s deadline; both response probes remained connection-refused | `test-results/gate-2/emulator-sjRIRT` |
| Instrumented diagnostic | First output 2,413 ms; Auth ready 70,520 ms; Firestore HTTP response by 66,079 ms, but a reserved readiness collection name caused HTTP 400 and a false timeout | `test-results/gate-2/emulator-4kpHnX` |
| Corrected readiness verification, tracing off | First output 1,221 ms; Auth ready 12,298 ms; Firestore ready 6,664 ms; early browser measurement passed | `test-results/gate-2/emulator-lEThB8` |
| Later contended verification | First output 41,417 ms; both probes remained connection-refused through 90 s; full unit tests ran concurrently | `test-results/gate-2/emulator-ntJvD0` |
| Sequential traced rules verification | First output 1,692 ms; Auth ready 15,185 ms; Firestore ready 8,025 ms; all 116 rules tests passed | `test-results/gate-2/emulator-tTNNLP` |
| First full browser run | First output 1,219 ms; Auth ready 12,179 ms; Firestore ready 5,966 ms; 28/31 browsers passed, three test waits corrected | `test-results/gate-2/emulator-OHvvmZ` |
| Acceptance after test-wait corrections | First output 1,704 ms; Auth ready 16,872 ms; Firestore ready 8,674 ms; 31/31 browsers passed | `test-results/gate-2/emulator-rsVPsK` |
| Review repeat | First output 1,428 ms; Auth ready 13,236 ms; Firestore ready 6,799 ms; 31/31 browsers passed | `test-results/gate-2/emulator-VehQSm` |

Java is Eclipse Temurin 21.0.12.1. Installed CLI is 15.34.0. The preflight now validates that installed CLI's package manifest instead of launching its expensive bootstrap solely to discover its version; a controlled regression verifies that `--version` is not invoked. This changes version discovery, not the emulator deadline.

The actual start's first output was the CLI debug banner. Installed `firebase-tools/lib/bin/cli.js` emits that banner after its top-level CommonJS imports finish; command parsing then synchronously loads `commands/emulators-start` and the broad emulator controller, which imports other emulator/framework packages even when only Auth and Firestore are selected. This localizes observed delay to CLI/bootstrap startup phases. The slow module and underlying cause remain **UNPROVEN**; no Java emulator progress or download was logged. The CLI MOTD function returns immediately under the runner's `CI=true`, so that specific network path is excluded by inspected code.

No `firebase-debug.log` appeared in that owned directory before termination. The CLI's Winston file transport starts asynchronously, which may not have run while synchronous imports continued; this is an explanation consistent with the evidence, not a proven cause. The captured stdout/stderr remains available. Existing unrelated root debug logs are left alone.

The opt-in process-local module tracer recorded complete module entry/exit durations from the actual CLI spawn; its overhead stayed inside the 90 s deadline. All module loads completed: main CLI bootstrap ended at 53.302 s; the emulator controller load took 50.472 s, including 31.357 s inside Pub/Sub dependencies (`--only auth,firestore` still imports that controller dependency). Nested inclusive times overlap and must not be summed. These measurements identify a delay phase, not an underlying filesystem/CPU cause. No prewarming, global CLI patch, dependency replacement, or deadline increase was used.

The diagnostic attempt also revealed an independent runner defect: Firestore rejects collection IDs matching the reserved double-underscore form. The readiness probe's `__taskly_readiness__` returned HTTP 400 while Firestore was running. It now reads the valid `tasklyReadiness` collection; a behavioral regression mocks the reserved-name rejection. The explicitly announced verification then passed under the unchanged deadline. Later attempts benefit from warmed machine/package caches; these successful numbers must not erase the retained cold failure.

These observations do **not** establish the cause of the historical G1 90 s timeout. G1's successful Auth readiness results remain 11.480 / 12.553 / 11.892 s. The early signed-in measurement passed with three active listeners and zero console errors; see [startup-early.json](startup-early.json). Rules verification on that same owned run passed 84/85 cases; the Unicode-title parity correction uses JavaScript trim's explicit whitespace code points, and the expanded 116-case suite passed on the later sequential run. Concurrent unit work makes the later failed start a contended measurement; neither contention nor a warmed passing rerun proves the underlying cold-start cause. No silent retry or deadline increase was used.

Complete normalized logs/config/startup/optional module traces are preserved in [emulator-logs](emulator-logs/README.md), alongside the untouched ignored raw directories. Both successes and failures are retained.
