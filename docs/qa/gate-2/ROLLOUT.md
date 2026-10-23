# G2 owner rollout handoff

Local checks do not complete G2. Q03 makes the owner's deployed-preview check a completion requirement. No rules deployment, console change, live seed, PR creation or merge has been performed by the agent.

| When | Owner action | Current status |
|---|---|---|
| Before database setup/deployment | Confirm intended Firebase project and whether Preview/Production share it. Check the existing Firestore database and permanent location in the console; leave an existing database alone. | UNVERIFIED |
| Only if no database exists | Check a suitable location's Spark availability. `firebase.json` says `(default)` / `nam5`; it does not prove a live database exists. A different selection needs owner wording before any config change. | UNVERIFIED; checked-in config unchanged |
| Before preview sign-in | Confirm the stable branch alias below in Vercel; add its exact host to Firebase Auth authorized domains. Never authorize all of `vercel.app`. Preserve Google provider setup and no COOP header. | UNVERIFIED |
| Before preview/Production checks | Confirm `VITE_USE_FIRESTORE_EMULATOR` and `VITE_USE_AUTH_EMULATOR` are unset in both Vercel environments. | UNVERIFIED |
| After rules review, before merge | Owner deploys the reviewed `firestore.rules` to the intended project. A shared-project deployment affects Preview and Production; identify that relationship first. | UNVERIFIED; agent never deploys |
| After rules deployment, before merge | Real Google sign-in on the G2 preview, with an account containing no Taskly data: first-run state and zero console errors. Report the result; this blocks G2 completion. | UNVERIFIED |
| After merge | Owner verifies Production sign-in and first-run/console behavior. | UNVERIFIED |

Expected stable alias: https://taskly-v2-git-gate-2-store-and-sync-lunacedricks-projects.vercel.app/

Read-only HEAD on 2026-10-23 returned HTTP 302 to `vercel.com`, consistent with deployment protection. The agent did not authenticate past that protection or verify the deployed app/project/commit. Confirm the alias in Vercel before authorizing its host.

A G2 build against live deny-all rules displays load error until reviewed rules are deployed. Current G1 Production has no Firestore import; deploying reviewed rules before the G2 merge does not introduce a Firestore call into that existing app. A local rules edit never deploys itself.

The real-account preview is deliberately empty: no product write UI or profile access exists in G2. It cannot reproduce the 1,000-task startup measurement. First-run proves project/task confirmation under Q23; activity readiness is nonblocking and has no G2 UI. No populated live-account demo is claimed; the populated demo uses the seeded emulator.

Java prerequisite is satisfied locally: Temurin 21.0.12.1; CLI 15.34.0. Local rules/browser runners require Java 21+, Auth 9099 and Firestore 8081. They do not use port 8080. The shared 90 s startup deadline is unchanged; retained failures remain part of the evidence.
