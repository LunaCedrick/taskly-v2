# Retained emulator diagnostics

Each `emulator-*.json.gz` is a gzip-compressed JSON object with the complete text files from its owned run: generated Firebase config, startup/probe records, combined timestamped stdout/stderr, debug logs when written, and optional module trace. Empty debug logs remain empty; missing files are not fabricated. The index lists readiness and test-command failures separately.

Decode with Node's `zlib.gunzipSync`, then `JSON.parse`; the `files` object maps original filenames to text. Local checkout/home paths are replaced with `<root>`/`<home>`, terminal colors removed, and token/Authorization values redacted. Timing, probe failures and module-load facts are retained. Original unique directories remain ignored under `test-results/gate-2`.

Successful readiness does not mean that the subsequent rules/browser command passed. See each archive's `startup.json` and the investigation report for that distinction. No unrelated old root logs were copied or removed.

`command-logs.json.gz` separately preserves seven complete outer command logs, including the failed and passing rules/browser runs, review output and earlier speed summaries. Its `files` object uses the same normalization/redaction; these are not confused with the emulator CLI child's own output.
