# G3 owner rollout

Checkpoint 2 handoff: the CRUD interface is integrated against the current G2 rules.
The proposed change is [PROPOSED-RULES.diff](PROPOSED-RULES.diff); `firestore.rules`
has not been edited. The agent never deploys rules or changes console settings.

Expected stable branch alias host (G2 alias naming convention):
`taskly-v2-git-gate-3-projects-tasks-lunacedricks-projects.vercel.app`.
Deployment identity and protection status are recorded in CHECKPOINT-2.md.

| Row / when | Owner action | Status |
|---|---|---|
| (a) Auth setup, before preview sign-in | Authorize the exact G3 branch alias host above in Firebase Auth. Never authorize all of `vercel.app`. Preserve the Google provider and no Cross-Origin-Opener-Policy header. G2 setup does not verify this host. | UNVERIFIED |
| (b) Before preview writes | Confirm `VITE_USE_AUTH_EMULATOR` and `VITE_USE_FIRESTORE_EMULATOR` remain unset in both Vercel Preview and Production. | UNVERIFIED |
| (c) Before rules deployment | Confirm `VITE_FIREBASE_PROJECT_ID` is still identical in Preview and Production. Rules deployment/rollback affects both environments. G2 Production code only reads; unchanged read rules keep it compatible. | UNVERIFIED |
| (d) Rules review/deployment | Review the proposed diff before the agent edits rules. After approval and tests, deploy yourself with `firebase deploy --only firestore:rules --project <id>`, then verify published text/timestamp in the console Rules tab. Use rules-only; a plain Firestore deploy also pushes indexes. Rollback: redeploy reviewed G2 rules from merge `0374036`, then confirm the console ruleset. | UNVERIFIED: review, deployment and publication |
| (e) After setup, before G3 completion | Check real Google sign-in and writes on Preview: create project, Quick Add, edit, complete, move status/project per Q07, delete task and project; zero console errors. Record URL/build/browser. Film both real device screens together: 3 samples each laptop→phone for add task, complete task, create project; 3 phone→laptop add-task samples. Every sample within 1 s; retain all samples/failures and fixture/network/device conditions. Preview and second-device results are separate and both required. Current rules can be used to try the interface before rules tightening. | UNVERIFIED: Preview and second-device timing |
| (f) After merge | Verify Production real Google sign-in, direct `/tasks`, expected data/state and zero console errors; report deployment identity. No agent merge/release authorization is implied. | UNVERIFIED |

Read-only empty-database record: VERIFIED by owner, 2026-10-24: the real project had
no collections or documents. This is the real-project legacy compatibility record;
no repeat console confirmation is requested. No live seed or migration was performed.

Preview and manual second-device checks block G3 completion by the owner's revision
request dated 2026-10-24; this is proposed G3 PLAN wording, not current PLAN §10 G3.
Q10 defers populated Production first-data measurement “until genuine G3 data exists”;
the owner said “I will decide after G3 merges.” Latency remains UNVERIFIED, with no
new pass/fail target. All six owner rows remain UNVERIFIED until owner reports arrive.
