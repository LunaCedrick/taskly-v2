# G3 owner rollout

Checkpoint 2 review: approved [PROPOSED-RULES.diff](PROPOSED-RULES.diff) and its tests
are applied in `6728275`; 122 rules tests passed at that commit. The owner reports
deployment on 2026-10-31 at 10:39 AM (Asia/Shanghai). This is the owner's report only;
the console Rules tab text check and Production check have not been reported.
The agent never deploys or changes console settings.

Expected stable branch alias host (G2 alias naming convention):
`taskly-v2-git-gate-3-projects-tasks-lunacedricks-projects.vercel.app`.
Deployment identity and protection status are recorded in CHECKPOINT-2.md.

| Row / when | Owner action | Status |
|---|---|---|
| (a) Auth setup, before preview sign-in | Authorize the exact G3 branch alias host above in Firebase Auth. Never authorize all of `vercel.app`. Preserve the Google provider and no Cross-Origin-Opener-Policy header. G2 setup does not verify this host. | VERIFIED by owner, 2026-10-31 |
| (b) Before preview writes | Confirm `VITE_USE_AUTH_EMULATOR` and `VITE_USE_FIRESTORE_EMULATOR` remain unset in both Vercel Preview and Production. | VERIFIED by owner, 2026-10-31 |
| (c) Before rules deployment | Confirm `VITE_FIREBASE_PROJECT_ID` is still identical in Preview and Production. Rules deployment/rollback affects both environments. G2 Production code only reads; unchanged read rules keep it compatible. | VERIFIED by owner, 2026-10-31 |
| (d) Rules review/deployment | Deployment instructions: deploy **only rules commit `6728275` after owner review**. Use a clean checkout pinned to the full hash below (`git status --porcelain` empty: no staged/untracked/modified files), with rules text matching `2a3d557:firestore.rules` plus only the approved `PROPOSED-RULES.diff`. Never deploy arbitrary branch HEAD. Owner only: `firebase deploy --only firestore:rules --project taskly-v2`, then verify published text/timestamp in the console Rules tab. Use rules-only; a plain Firestore deploy also pushes indexes. Rollback: clean checkout of reviewed G2 rules at merge `0374036`, same project, then confirm the console ruleset. These instructions do not establish the deployed commit or console text. | DEPLOYED by owner, 2026-10-31, 10:39 AM (Asia/Shanghai), owner report only; console Rules tab text check UNVERIFIED |
| (e) After setup, before G3 completion | Check real Google sign-in and writes on Preview: create project, Quick Add, edit, complete, move status/project per Q07, delete task and project; zero console errors. Record URL/build/browser. Film both real device screens together: 3 samples each laptop→phone for add task, complete task, create project; 3 phone→laptop add-task samples. Every sample within 1 s; retain all samples/failures and fixture/network/device conditions. Preview and second-device results are separate and both required. | owner-verified by the owner on 2026-10-31; formal 12-sample timing table not retained |
| (f) After merge | Verify Production real Google sign-in, direct `/tasks`, expected data/state and zero console errors; report deployment identity. No agent merge/release authorization is implied. | UNVERIFIED |

Rules candidate pin: `6728275e91aea331b77eb5417cc563350e716af0`.
The instructions require `git rev-parse HEAD` to equal that hash and the clean
checkout/rules-text checks in row (d). The owner's deployment report does not separately
confirm those checks, the deployed commit, or the console Rules tab text. Production
verification remains UNVERIFIED in row (f). Row (e) records the requested owner
verification after the owner confirmed zero Preview console errors on 2026-10-31;
the formal 12-sample timing table was not retained. No sample durations are inferred.
This does not verify the Firebase console Rules tab text. No agent deployment occurred.

Read-only empty-database record: VERIFIED by owner, 2026-10-24: the real project had
no collections or documents. This is the real-project legacy compatibility record;
no repeat console confirmation is requested. No live seed or migration was performed.

Preview and manual second-device checks block G3 completion by the owner's revision
request dated 2026-10-24; this is proposed G3 PLAN wording, not current PLAN §10 G3.
Q10 defers populated Production first-data measurement “until genuine G3 data exists”;
the owner said “I will decide after G3 merges.” Latency remains UNVERIFIED, with no
new pass/fail target. The row statuses above record only the owner's reported results.
