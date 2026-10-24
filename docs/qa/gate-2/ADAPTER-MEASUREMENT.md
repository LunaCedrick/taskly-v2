# G2 adapter checkpoint — 2026-10-22

Steps 2–3 only. The owner approved the plan with P1–P8, recorded in the first gate commit `e469443`. Stop here before store, session, listener, codec, UI, rules, or emulator-runner implementation. This is not a completed G2 review.

## Matched production measurements

Each number is bytes gzip, summing each emitted JavaScript asset once. Initial means the entry, its transitive static imports, and HTML modulepreloads, deduplicated (Q01). Deferred contains the remaining emitted JavaScript. The 200,000 B budget applies to initial JavaScript; total is reported alongside it. Q02 drops the former 50,000 B extra threshold.

| Variant | Initial | Deferred | Total | Total increase over matched baseline |
|---|---:|---:|---:|---:|
| Frozen G1 baseline | 126,223 | 0 | 126,223 | 0 |
| Lazy read adapter | 126,799 | 134,622 | 261,421 | 135,198 |
| Lazy extended measurement, including write APIs | 126,799 | 138,163 | 264,962 | 138,739 |

The read adapter adds **576 B initial**, leaving **73,201 B** below the initial budget. Retaining the write APIs adds **3,541 B deferred** relative to the read variant. These are matched measurements, not the reviewer's indicative unmatched probes. The extended variant authorizes no product write functionality.

The ordinary production application still measures **126,223 B initial, 0 B deferred, 126,223 B total**, because the adapter is deliberately unwired at this checkpoint. The historical G1 evidence is 126,224 B; the fresh pre-adapter build is 126,223 B. That one-byte historical difference is not assigned a proven cause.

Machine-readable evidence:

- [firestore-adapter-bundle.json](firestore-adapter-bundle.json): all three matched variants, per-chunk raw/gzip bytes, import edges, module IDs, emitted SHA-256 hashes, retained exports, eager-control rejection, and toolchain.
- [pre-adapter-baseline.json](pre-adapter-baseline.json): fresh G1 build captured before this stage's tooling changes.
- [bundle.json](bundle.json): actual unwired production application's budget and import-graph result.
- [production-bundle-graph.json](production-bundle-graph.json): production chunk metadata and hashes used by `measure:bundle`.

## Loading boundary evidence

For the read harness, the only HTML/entry root is `assets/index-CEGxP38t.js`. It has a **dynamic** edge to `assets/_taskly_firestore-measurement-CLqPsdfQ.js`. The deferred chunk statically imports shared code from the entry; there is no static edge in the opposite direction, and no HTML modulepreload reaches Firestore. `initialFirestoreChunks` is empty for both lazy variants.

The deferred read chunk contains these runtime SDK module IDs, rather than merely having a suggestive filename:

```text
node_modules/@firebase/firestore/dist/common-D9UYuXJO.esm.js
node_modules/@firebase/firestore/dist/index.esm.js
node_modules/firebase/firestore/dist/esm/index.esm.js
```

A deliberate eager-import control fails the production build with `Firestore runtime reaches initial JavaScript`. Automated actual-Vite fixtures also reject an eager import and an HTML modulepreload of an otherwise deferred SDK chunk. Unit graph cases cover static closures, re-exports/shared chunks, HTML roots, deduplication, and unknown edges. Both the build and `measure:bundle` enforce the boundary; the latter verifies the emitted chunk hashes before trusting graph metadata.

Checkpoint review fix (2026-10-23): a normal build saves the graph to gitignored `test-results/gate-2/bundle-graph.json`, outside `dist`; no graph asset is deployed. Both measurement commands reject missing graphs and mismatched chunk/HTML hashes with an instruction to rebuild. In-memory adapter builds capture their own graphs without overwriting the saved production graph. Regenerated adapter evidence normalizes local paths to `<root>` and strips ANSI formatting; all recorded raw/gzip sizes and emitted chunk hashes match `a6088c3` exactly. The new regression tests include actual build output and both commands' missing/stale failure paths.

The future product boundary remains `src/lib/subscriptions/index.ts`, dynamically loading listeners and the adapter after resolved sign-in. It is not implemented in this stage. No measurement retention hook was added to product sources: the Auth-gated namespace-retention hook exists only in the harness's in-memory build transform.

## Measurement method and limits

`npm run measure:firestore-adapter -- --record-evidence` builds frozen `src` from revision `9a111e7` with identical current production configuration, dependencies, environment inputs, and gzip settings for the three variants. It uses Vite `write: false`; the harness never replaces the real production build or modifies frozen source files. Required read/cache/emulator exports are retained. A separate extended variant retains `setDoc`, `updateDoc`, `deleteDoc`, `writeBatch`, `serverTimestamp`, and `Timestamp` only for measurement.

Frozen sources are explicitly normalized to CRLF to match this checkout. Controlled in-memory builds showed that LF versus CRLF changed the emitted asset hashes; CRLF reproduced the fresh baseline's JavaScript and CSS hashes exactly. This explains the initially observed frozen-source mismatch. Only `src` is frozen: exact bytes on another machine still depend on the shared HTML/configuration, lockfile, and local `VITE_*` inputs. No environment values are recorded here.

Toolchain: Node 24.16.0, npm 11.16.0, Vite 8.3.4, exact `firebase@13.0.0`. No dependencies were installed; the Firebase pin and lockfile are unchanged. The isolated adapter initializes Firestore once, explicitly uses `memoryLocalCache()`, and connects only with the explicit emulator flag and demo-project guard, using the existing shared port **8081**. Auth persistence is unchanged.

**UNVERIFIED runtime costs:** signed-in startup transfer and first-data latency at 4x CPU. This build-only harness measures payload sizes; it does not execute the SDK or simulate real network transfer. These runtime measurements require the later authorized session/listener integration and must include the lazy import. The combined read payload is 261,421 B gzip; it is not a measured browser transfer.

## Prerequisites and owner setup

- `java -version` passes: Eclipse Temurin 21.0.12.1. No Java installation is currently needed. Firebase CLI 15.34.0 is available. No emulator was started, so startup timing and SDK offline timing remain unmeasured.
- Existing Auth 9099 / Firestore 8081 constants, `firebase.json`, the shared 90 s startup deadline, and the `demo-taskly-auth` project name are unchanged. The name is now a misnomer for the combined emulator setup; runner logs and measured startup remain later work.
- Owner console checks remain **UNVERIFIED**: whether the Firestore database exists, its permanent location, Spark-plan availability if creating it, and whether Preview and Production share a Firebase project. Checked-in `nam5` is not proof of live configuration. Leave an existing database alone; a different selected location needs the owner's wording before changing the frozen configuration.
- Before the preview check, the owner must authorize this branch's exact stable Vercel hostname in Firebase Auth, never all of `vercel.app`. No alias or authorized-domain change has been claimed as verified.
- After rules review and before merge, the owner deploys rules and verifies preview first-run with real Google sign-in. If both environments share the project, that deployment affects both; current G1 Production has no Firestore imports. The owner verifies Production after merge. Rules deployment and both live checks remain **UNVERIFIED** until the owner reports them; the preview check blocks G2 completion.

## Validation and remaining work

All checkpoint checks pass: `npm run build`, `npm run lint`, `npm run typecheck`, `npm run test` (**117 tests / 13 files, 33.57 s**), `npm run measure:bundle -- --record-evidence`, and `npm run measure:firestore-adapter -- --record-evidence`. The test count includes 10 adapter tests, 28 graph-accounting tests, and 3 actual-Vite build tests. Searching `src` and normal production `dist` for the measurement-only hook names returns no matches (expected `rg` exit 1). `git diff --check` passes; protected documents, Firebase configuration, dependency lockfile, and G0/G1 evidence are unchanged.

The existing Lighthouse script was **skipped**: it writes `docs/qa/gate-0/lighthouse.json`, which would modify committed G0 evidence. No G0 evidence was overwritten. Lighthouse remains non-blocking under Q09.

No app integration, new listeners, one-shot reads, persistent Firestore cache, profile access, write layer, rules changes, rules-test dependency installation, live deployment, emulator/browser tests, or full-gate review was performed. Audit/gRPC reachability assessment, emulator startup logs, SDK cache/offline timing, speed/navigation attribution, states, rules, and live preview verification remain their later skill steps. G2 remains incomplete.
