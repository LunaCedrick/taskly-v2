# G2 owner rollout handoff

G2 completion combines the recorded local checks with the owner's accepted speed record, rules deployment, published-rules confirmation and deployed-preview check under Q03. G2 merged through plain merge commit `0374036` (PR #5); Production is **VERIFIED by owner, 2026-10-24** as recorded below. No rules deployment, console change, live seed, PR creation or merge has been performed by the agent.

| When | Owner action | Current status |
|---|---|---|
| Database setup | Existing Firestore `(default)` database in `asia-southeast1`; leave it alone. Owner authorized only the matching location correction in `firebase.json`; emulators block unchanged. | VERIFIED by owner, 2026-10-23 |
| Vercel setup | Preview and Production checked in Vercel. | VERIFIED by owner, 2026-10-23 |
| Firebase Auth setup | G2 branch alias host is authorized. Never authorize all of `vercel.app`; preserve Google provider setup and no COOP header. | VERIFIED by owner, 2026-10-23 |
| Emulator flags | Both emulator flags are unset in Preview and Production. | VERIFIED by owner, 2026-10-23 |
| Before rules deployment | Preview and Production use the same Firebase project ID (`VITE_FIREBASE_PROJECT_ID` is identical in both). The rules deploy and any rollback affect both environments. | VERIFIED by owner, 2026-10-23 |
| After rules review, before merge | Owner deployed `firestore.rules` from `f92fb4b` with `firebase deploy --only firestore:rules --project taskly-v2`. Preview and Production share this Firebase project (owner-verified 2026-10-23), so the rules deploy and any rollback affect both. | VERIFIED by owner, 2026-10-23; agent never deploys |
| Immediately after rules deployment | Console Rules tab showed publication at Oct 23, 3:54pm; the text matches the reviewed file from `f92fb4b`. | VERIFIED by owner, 2026-10-23 |
| After rules deployment, before merge | Preview at `f92fb4b`, fresh Chrome profile, 155.0.8059.85 (Official Build) (64-bit) (cohort: Stable), Windows 11: real Google sign-in worked; first-run shown; no load error after 15 s or on Dashboard/My Tasks; 0 console errors; reload kept the session; sign-out returned to sign-in. | VERIFIED by owner, 2026-10-23 |
| After merge | Production sign-in worked; first-run state with no load error; `/tasks` loaded directly (no 404); zero console errors. | VERIFIED by owner, 2026-10-24 |

Expected stable alias: https://taskly-v2-git-gate-2-store-and-sync-lunacedricks-projects.vercel.app/

Read-only HEAD on 2026-10-23 returned HTTP 302 to `vercel.com`, consistent with deployment protection. The agent did not authenticate past that protection. The owner subsequently verified the setup, shared-project identity, deployment, console ruleset match and preview behavior on 2026-10-23, then Production on 2026-10-24. These are owner-reported results, not independent agent verification. The same Production check also covers G1's outstanding Production items: build Ready, sign-in works and the `/tasks` deep link does not 404.

## Owner deployment and published-rules confirmation

After reviewing `firestore.rules` at `a7afb5d` (unchanged by these fixes), use the intended Firebase project ID in place of `<id>` and run from this gate checkout:

```text
firebase deploy --only firestore:rules --project <id>
```

Use exactly `--only firestore:rules`. A plain `firestore` deploy (for example `--only firestore`) also pushes the empty `firestore.indexes.json`, and the CLI may offer to delete existing indexes. No index deployment or deletion is part of this handoff.

In the Firebase console, select the same project and Firestore `(default)` database, open the **Rules** tab and inspect the published ruleset. Check its deployment timestamp against this deployment and compare the complete published text with the reviewed `firestore.rules` (`f92fb4b`, unchanged from `a7afb5d`). A CLI success message alone does not replace that check. The owner reported project `taskly-v2`, publication at Oct 23, 3:54pm and matching text: **VERIFIED by owner, 2026-10-23**.

## Owner rollback

Rollback is **UNVERIFIED** and has not been performed. Redeploy pre-G2 main's deny-all `firestore.rules` using the same rules-only command. Main at this review is `9a111e7e2cf6187610be80059706fd2d2c5a6144`; its rule is `allow read, write: if false`. Use an isolated checkout so the reviewed gate file is not overwritten:

```text
git worktree add --detach ../taskly-g2-rules-rollback 9a111e7e2cf6187610be80059706fd2d2c5a6144
cd ../taskly-g2-rules-rollback
firebase deploy --only firestore:rules --project <id>
```

Inspect that checkout's deny-all file before deploying. Use the pinned pre-G2 commit even if main later contains G2. Confirm the rollback's published timestamp/text in the console Rules tab too. Deny-all blocks all client Firestore reads/writes: Preview and Production share this project (owner-verified 2026-10-23), so rollback affects **both immediately**. A deployed G2 app shows load error; existing G1 Production has no Firestore imports. It does not roll back Auth or the Vercel app. The agent runs none of these deployment/rollback commands.

A G2 build against live deny-all rules displays load error until reviewed rules are deployed. Current G1 Production has no Firestore import; deploying reviewed rules before the G2 merge does not introduce a Firestore call into that existing app. A local rules edit never deploys itself.

The real-account preview is deliberately empty: no product write UI or profile access exists in G2. It cannot reproduce the 1,000-task startup measurement. First-run proves project/task confirmation under Q23; activity readiness is nonblocking and has no G2 UI. No populated live-account demo is claimed; the populated demo uses the seeded emulator.

Java prerequisite is satisfied locally: Temurin 21.0.12.1; CLI 15.34.0. Local rules/browser runners require Java 21+, Auth 9099 and Firestore 8081. They do not use port 8080. The shared 90 s startup deadline is unchanged; retained failures remain part of the evidence.
