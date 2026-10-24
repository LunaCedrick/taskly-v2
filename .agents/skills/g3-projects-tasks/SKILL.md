---
name: g3-projects-tasks
description: "Use to build Gate 3 of Taskly: project and task create, edit, delete, forms, Quick Add, pickers, dialogs, and toasts."
---

# Gate 3: Projects, tasks, Quick Add

Status: Approved by the owner on 2026-10-24. The owner's answers to the OPEN questions are in docs/decisions/g3.md and override the recommendations in this skill. Implementation still requires approval of the step 1 plan.

Goal: make project and task writes fast, accessible, and synchronized without slowing navigation or moving Firestore into initial JavaScript.

Read: `docs/PLAN.md` section 4 (Projects, Tasks, Quick Add, due-time and accessibility criteria), section 5 (existing architecture and document model), section 6, and section 10 (common requirements and G3 only). Read section 3’s Non-goals and approved Due time, Project colors, and Category suggestions rows. Read `docs/DESIGN.md` and `docs/SCREENS.md` (Project view, Task form, Dialogs, Quick Add, Toasts, formatting rules, and first-run/empty-project actions only).

Carry-over references: `docs/qa/gate-2/DOCUMENT-CONTRACT.md`; `docs/DECISIONS.md` (G2 owner decisions and implementation-plan answers); `docs/CONTEXT.md` sections 6–8; and `docs/qa/gate-2/bundle.json`, `docs/qa/gate-2/production-bundle-graph.json`, `docs/qa/gate-2/rollout-fixes-speed/README.md`, `docs/qa/gate-2/STARTUP-MEASUREMENT.md`, `docs/qa/gate-2/EMULATOR-STARTUP.md`, `docs/qa/gate-2/REVIEW.md`, `docs/qa/gate-2/ROLLOUT.md`, and `docs/qa/gate-2/dependency-audit.txt`. Prefer the latest dated rollout record over superseded status statements.

Visual references: `project-view.png`, `project-view-phone.png`, `task-form.png`, `task-form-phone.png`, `dialogs.png`, `quick-add.png`, `quick-add-phone.png`, `pickers.png`, `toasts.png`, `components.png`, `menu-drawer-phone.png`, and the first-run/empty-project panels under States in `states.png`, all under `docs/design/`. Use `dashboard.png` only as Q07’s activity-text reference, not authorization for dashboard UI. Pickers are described under Task form and DESIGN Additions, not a separate SCREENS behavior section.

Do not: edit `AGENTS.md` or `docs/PLAN.md`; build G4 dashboard sections or activity UI, G5 search/filter/sort/alerts, or G6 pages and release work. Preserve existing later-gate placeholders and G2’s approved minimal unknown-project treatment. Do not add a custom calendar, natural-language date parsing, swipe actions, drag-and-drop, an offline banner, Undo, profile writes, persistent Firestore cache, collection-group queries, one-shot product reads, or extra listeners. Never add a Cross-Origin-Opener-Policy header; it breaks the Google sign-in popup. No file over 300 lines.

Use existing tokens, controls, selectors, and virtualization. All state, including drafts, overlays, pending actions, errors, and toasts, goes through the existing store. Keep business logic pure in `src/lib`, with meaningful unit tests. Explain shared-file changes in the implementation plan. Ask before adding dependencies; preserve the exact Firebase pin, shared emulator ports, and existing configuration.

OPEN means an owner decision. A recommendation is not approval. Do not implement an unresolved policy, encode it in tests, or make it an exit condition. General approval of this skill does not select its recommendations.

## Pages and features

- Shared project dialog for create and rename; task and project deletion confirmations.
- Task add/edit form: desktop modal and phone bottom sheet.
- Native date/time inputs, due-date quick chips, project and priority pickers, and category suggestions.
- Working Quick Add from the existing shell, including its no-project flow and “More options” handoff.
- Working first-run, empty-project, topbar, project-row, and Q13-approved task-row CRUD entry points.
- Project progress bar and percent; task row actions where approved by Q13. “Move” semantics remain OPEN Q07.
- Added, Deleted, and Save failed toasts.
- Lazy Firestore writes, required activity records, and approved cascading deletion behavior; no activity presentation.

## Targets (all must be met)

- Projects can be created, renamed, and deleted. Empty and duplicate names are rejected under the approved comparison policy. Task and project deletion require confirmation.
- Tasks support create, edit, complete, move as defined by Q07, and delete with validation. Titles contain at least one non-whitespace character; validation does not rewrite stored title text.
- Quick Add takes at most three steps: open, type, Enter. The new task appears **under 100 ms** after Enter through optimistic local updates.
- On valid Enter submission, Quick Add clears its title immediately and keeps the input focused, independent of Q08’s toast timing. “More options” preserves the title.
- A change appears on a second device **within 1 s**, checked manually and recorded.
- Cascading project deletion removes its tasks using batches of **at most 500 write operations**, including activity and other writes in each batch.
- Activity entries are written for add, complete, move, and delete according to the approved event contract.
- A due date without a time means the end of that day; an explicit time means that time. Preserve consistent selector behavior.
- Runtime Firestore remains outside the entry’s transitive static-import and HTML-modulepreload graph. Initial JavaScript remains **under 200,000 B gzip**.
- Report initial, deferred, and total JavaScript against G2’s **127,820 / 137,162 / 264,982 B** gzip baseline.
- Exactly three healthy session listeners remain: projects, tasks, and latest-20 activity. Navigation neither changes registrations nor clears data.
- Common to every gate: route-change **p95 < 100 ms** with 1,000 tasks and 4× CPU throttle; required checks pass; no console errors; no horizontal scroll at 390 and 1280 px; keyboard access, visible focus, AA contrast, 44 px targets, reduced motion, and the `review` skill.

Quick Add and second-device measurement protocols remain OPEN Q14; PLAN supplies their thresholds, not sample counts or percentiles. By the owner’s revision request dated 2026-10-24, real-Google preview and manual second-device checks block marking G3 complete; this is an owner-added G3 exit condition, not current PLAN §10 G3 wording. Production first-data measurement is conditional on Q10 and never pass/fail; G2’s confirmation timeout is not a latency budget.

## Steps

1. Inspect the existing integration points and propose the implementation plan; wait for approval before app coding.
   - Name proposed files, shared-file changes, write boundaries, store changes, tests, measurements, compatibility risks, and any dependency request.
   - Expected areas include `src/features/projects`, `src/features/tasks`, a Quick Add feature folder, shared dialogs/pickers/toasts in `src/ui`, `src/store`, pure helpers in `src/lib`, lazy mutation code under `src/lib/firebase`, and the existing subscriptions, tests, and measurement tooling.
   - After implementation-plan approval, use `gate-3-projects-tasks`. This drafting request authorizes no branch changes, commits, or pushes.
   - Present every OPEN question below with its recommendation. Record actual owner answers separately with provenance; leave unanswered items unresolved.

   - **OPEN Q01 — Decision-log structure:** How should the exactly-300-line `docs/decisions/g0-g2.md` be split or archived before G3 adds records? Recommend per-gate decision files with a short index, preserving history and attribution. During that approved restructure, reconcile lines 292–294’s stale “not applied” wording with commit `6a8144d`, which applied the PLAN wording. Do not append, split, archive, or correct the log in this revision.

   - **OPEN Q02 — Project-name validation:** What defines an empty/duplicate project name, and what concurrency guarantee is required? Recommend rejecting whitespace-only names and a store-only, best-effort trimmed/case-insensitive duplicate check, excluding the project being renamed. Allow same-name and case-only renames; preserve entered text. This cannot guarantee uniqueness across concurrent clients; stronger enforcement is a separate proposal.

   - **OPEN Q03 — String limits:** G2 Q17’s “No string length caps” remains the standing owner decision. Retain it in G3, or explicitly replace it with specified per-field form/rule limits? Recommend retaining no caps. If the owner instead requests caps, define form requirements and compatible write validation first; do not invent numeric limits or treat caps as the default.

   - **OPEN Q04 — Defaults and palette reuse:** How should last-used project state persist, deleted-project fallback work, full forms default outside a project route, and colors be assigned after deletions or beyond six projects? Recommend session-only state; valid current project → valid last-used project → oldest remaining project (`createdAt`, then ID), with confirmed-empty projects opening New project and resuming the initiating draft. Recommend To do, no priority/date, empty description/category, and null completion time for new tasks. For colors, recommend first unused palette entry in order, then least-used entry with palette-order ties. These are proposals, not selected policies.

   - **OPEN Q05 — Calendar and storage semantics:** What does “Next week” mean, what exact instant encodes a date-only value, and which zone governs dates and times? `dates.ts:12–21` currently applies end of day in the viewer’s local zone; storing the creator’s local midnight can shift the calendar date for viewers further west. Recommend the next strictly future Monday (Sunday → tomorrow; Monday → seven days later). Recommend UTC-midnight encoding of the selected calendar date, UTC component extraction for date-only helpers before applying the viewer’s local end of day, and absolute instants for explicit times. Compatibility cost: date-only fixtures currently use local midnight (`src/lib/fake-data.ts:21`, seeded through `tests/e2e/fixtures/firestore.ts:66`); reading UTC components would move them a day in zones east of UTC. Adopting the recommendation requires fixture/seeding-expectation and helper/formatting test updates, including east/west-zone/DST cases. The owner-reported empty real project needs no live migration. Do not add a timezone field implicitly.

   - **OPEN Q06 — Creation timestamps:** Should reviewed rules require `createdAt == request.time` on create? Recommend yes for new project, task, and activity documents, with server-timestamp writers and immutable `createdAt` on update. This changes approved rules: review the diff and real-SDK rules tests before editing `firestore.rules`.

   - **OPEN Q07 — Activity, move, and completion contract:** Does “move” mean a status change, project change, or both? Are project create/rename/delete events written? `dashboard.png` shows `Moved <task> to In progress` and “Created the project Personal”; it is an activity-text reference only. Recommend both kinds of move with distinct types, project CRUD events, complete on entering Done, no no-op/duplicate events, and an approved event matrix for simultaneous changes. Recommend setting `completedAt` on entering Done, clearing it on reopening, and preserving it on other completed-task edits; pair each mutation with its required activity in an approved atomic unit. For cascade deletion, per-task entries allow about 250 deletes + 250 activity writes per batch: about 2,000 writes for 1,000 tasks plus project removal, at least five PLAN-sized batches, and 20 deletions fill the latest-20 window. Recommend one project summary (`taskId: null`, `projectId` set) in the final batch, atomic with project removal and compatible with G2’s field contract; single-task deletion still gets its own entry. The alternative is per-task entries or both. Approve exact types, text, references, and enum enforcement before writers/rules/codecs encode them.

   - **OPEN Q08 — Save/toast timing and recovery:** Show success on local apply or server acknowledgement, and how should rejected saves, later input, conflicts, and partial deletion recover? SCREENS.md:44 lists the toast with immediate task appearance/title clearing; toasts.png supplies “Task added to {project}”, “Task deleted”, and “Could not save your change”. Local-apply toasts give immediate feedback but can precede rejection; ack-gated toasts confirm persistence but never appear while offline without an ack timeout and can arrive after later typing. Recommend local-apply success for normal single-task/project writes with their approved activity, and final-batch acknowledgement for a cascade so partial deletion is not reported complete. Keep errors sticky and submitted drafts recoverable without overwriting newer input. Only undesigned copy/recovery actions need proposals, such as “Project deleted”; no Undo or blind retries. Title clearing remains immediate and independent of this choice.

   - **OPEN Q09 — Cascade strategy and accepted limits:** Use simple task-first/project-last deletion, retrying deletion on the remaining project, or a durable deletion guard? Recommend the simple option for PLAN G3’s scope and unchanged schema. G2 Q05 already hides orphan tasks; it does not prove integrity or close the narrow concurrent-device create/project-change race. If the owner selects this option, record that race as an accepted limitation and define partial-failure/retry behavior. A guard can strengthen coordination but requires a separately approved schema/path/backend and G2 compatibility design. Neither ordering nor a project-existence rule alone guarantees zero orphans. This OPEN choice must not become an unapproved race-free exit condition.

   - **OPEN Q10 — Whether to measure Production first data in G3:** Include this measurement in G3 at all, or defer it? docs/decisions/g0-g2.md:300 says “the owner will decide after G2 on a first-data target or mitigation”; whether to measure in G3 is the question derived from that record, not its literal wording; the owner’s Production account showed first-run, and the owner now reports no collections/documents in the real project. Recommend deferring populated measurement until genuine G3 data exists. If included, approve the account/data, read-only capture method, number of cold/restored-session samples, and conditions (recommend Slow 4G and 4× CPU). It remains measurement-only; no live seeding, settings changes, or latency threshold is implied.

   - **OPEN Q11 — Unsynced writes and departure:** Memory-only cache is not durable: queued, unacknowledged writes can be lost on tab close. Sign-out clears the store, but what happens to old-user SDK-queued writes is unverified and must be tested in the emulator. Choose a pending-only `beforeunload` guard, sign-out confirmation, a documented v0.1 limitation, or a combination. Recommend a pending-only unload guard plus sign-out confirmation, with the unload guard explicitly best effort, not a durability guarantee. Do not implement guards, persistence, an offline banner, or a new ack timeout before approval; measure sign-out/reconnect/account-switch behavior rather than assuming cancellation.

   - **OPEN Q12 — Overlay destinations and readiness:** After deleting the current project, where should navigation/focus go? Where should focus return if a trigger row was deleted? What does Quick Add do while projects are not server-confirmed or have a load error? Recommend Dashboard with heading focus after current-project deletion; next surviving row action, otherwise the add-task row, after task deletion; and a visible disabled Quick Add with an accessible explanation until projects are confirmed and usable. “No projects” means server-confirmed empty, never loading/error. These destinations/readiness controls require approval before implementation.

   - **OPEN Q13 — G3 row-action scope:** Which routes get live task row actions? SCREENS’ index gives G3 actions only to Project view; My Tasks is G2 list/G5 filters, and Dashboard complete-in-place belongs to G4. Recommend Project view only, retaining globally specified Quick Add/topbar add and project-creation entry points. Other-route row mutations require an explicit scope decision.

   - **OPEN Q14 — Write-speed pass protocols:** What sample counts, every-sample versus percentile rule, fixture size, CPU/network conditions, and flows apply to “under 100 ms after Enter” and “within 1 s”? PLAN specifies no percentile for either. Recommend 20 valid Quick Add submissions across Project view and My Tasks, 1,000 emulator tasks, 4× CPU, resolved Auth/data/fonts/lazy modules, every Enter-to-task-paint sample <100 ms. For sync, recommend three samples per approved project/task write flow in each direction on two real devices, a small real test project with counts recorded, normal documented network/unthrottled CPU, every sender-action-to-receiver-paint sample within 1 s. Record all samples and failures. These proposed protocols are not exit conditions until approved and do not replace navigation’s separate p95 rule.

2. Confirm prerequisites, baseline, and inherited contracts.
   - Check existing commands and tooling; report missing commands instead of guessing replacements. Run `java -version` before emulator-dependent checks.
   - Reuse Auth 9099 and Firestore 8081 from the shared constant. Preserve the existing shared 90-second emulator startup deadline, readiness checks, process ownership, and retained failure logs.
   - Freeze the baseline revision and measure the unchanged production build before integration. Record toolchain/environment differences alongside the G2 byte baseline.
   - Preserve G2’s exact document field sets, timestamp storage, numeric UI milliseconds, status/priority values, palette bounds, nullable activity references, immutable creation timestamps, and denied profile access.
   - Preserve server-confirmed initial readiness, failed-stream recovery, activity’s non-blocking view policy, effective-data equality, orphan exclusion/counting, and publication-time clock behavior. The minute tick remains G5.
   - G2 Production sign-in/first-run behavior was verified by the owner on 2026-10-24. This does not verify populated Production first-data latency.

3. Establish the lazy mutation boundary.
   - Add mutation implementations such as `src/lib/firebase/writes.ts` inside the existing lazy Firestore boundary. Reuse memoized `initializeBrowserFirestore` (`firestore.ts:6–9`) and expose an SDK-free facade to feature/store code.
   - Keep runtime SDK imports, batch construction, document references, timestamp sentinels, and SDK-specific encoding in lazy modules.
   - Store modules, selectors, pure helpers, shared controls, codecs, and entry-loaded facades must not acquire runtime `firebase/firestore` imports through direct imports, barrels, or re-exports. Use type-only imports where needed.
   - Resolve required mutation modules through the signed-in session boundary; route changes must not initiate imports or other network work.
   - Validate the normal production module graph and bundle sizes before integrating the interfaces, then again after integration. A runtime Firestore static/preload reachability failure or initial size `>= 200,000 B` stops integration.
   - Do not reinstate G2’s dropped 50,000-byte extra threshold or treat deferred/total baseline sizes as new caps.

4. Handle pending timestamps before enabling product writes.
   - Today `change.doc.data()` has no timestamp options: pending required timestamps read as null, the codec throws, and `listeners.ts:97–100` stops the stream. For projects/tasks this displays the load-error panel; the defect is a killed stream, not merely a null value.
   - Use deliberate snapshot handling, for example `data({ serverTimestamps: 'estimate' })`, before structural decoding. Estimates can change after server acknowledgement. [Firebase SnapshotOptions](https://firebase.google.com/docs/reference/js/firestore.snapshotoptions).
   - Preserve structural decoding and numeric UI milliseconds without importing runtime `Timestamp` into entry-loaded code.
   - Do not broadly accept null required timestamps from confirmed malformed documents. Keep nullable fields distinct from pending server-generated values.
   - Test actual local pending creation, updates, completion, activity ordering/window changes, acknowledgement, and rejected writes through the real subscription/codec path.
   - A pending write must not stop a listener, produce a false malformed-data error, or clear healthy views. Preserve meaningful readiness and metadata updates.
   - **STOP — checkpoint 1:** After steps 3–4, report the verified lazy mutation boundary, initial/deferred/total bundle and graph results, and real-emulator pending-write → acknowledgement/rejection evidence showing no killed listener. Wait for explicit owner approval before step 5 or later integration; step 1’s plan approval does not waive this checkpoint.

5. Implement write coordination through the existing store.
   - Put validation, operation planning, date conversion, event selection, and batch partitioning in pure helpers.
   - Follow PLAN’s local-cache → listener → store flow for optimistic entity updates. Avoid a second component-owned entity state or duplicate optimistic insertion.
   - Track drafts, pending operations, submitted values, errors, and overlay state through store selectors.
   - Apply the approved save/activity contract, including duplicate-submission prevention and safe retry identity.
   - A failed required activity write must not silently count as a successful save. Batched writes are atomic within one batch; multiple cascade batches are separate commit units. [Firebase batched writes](https://firebase.google.com/docs/firestore/manage-data/transactions).
   - Handle rejection and reconciliation without blindly restoring stale documents over newer remote edits.
   - Reuse memoized `initializeBrowserFirestore` and the generation-token/session stale-result pattern in `src/lib/subscriptions/index.ts:4,18,29`; check identity before dispatch and applying results. Apply Q11’s departure policy before clearing transient state. A generation guard/store reset does not prove cancellation of SDK-queued writes: verify offline/delayed-write → sign-out → reconnect/account-switch behavior and retain actual acknowledgements/errors.
   - Do not introduce a write-acknowledgement timeout or offline queue policy that the owner has not approved.

6. Build project CRUD and the approved cascade.
   - Reuse one create/rename dialog with field-level errors; implement Q04’s approved palette reuse. Build the project header progress bar and percent from existing selectors (currently text only), retaining 0% for zero tasks.
   - Keep project-name comparison, limits, and concurrency behavior conditional on Q02/Q03.
   - Confirm deletion using the project name and affected task count; Q08/Q12 must decide whether that count includes locally pending tasks or waits for acknowledgement. Initial server confirmation does not settle this policy for later pending writes.
   - Implement only Q09’s selected cascade/retry strategy. The simple option does not require a durable guard or new fields; any guard/`deleting` field needs separate approval.
   - Partition by total write operations, reserving space for activity, coordination, and project writes. Never submit 500 task deletes plus additional writes in the same batch.
   - Cover empty projects, boundary sizes, more than 1,000 tasks, and Q09’s selected partial-failure/interruption/retry behavior. Concurrent create/project-change scenarios document the simple option’s accepted limitation or test an approved guard; they do not silently add a zero-orphan target.
   - Do not claim that the entire cascade is atomic, that a final client-side scan closes races, or that hiding orphan rows proves deletion integrity.
   - Follow Q09 for partial failure and Q12 for post-delete navigation/focus. Keep dependent behavior unresolved until those answers exist.

7. Build the task form and pickers.
   - Support add/edit modes with Title, Description, Due date, optional time, Project, Priority, Category suggestions derived only from tasks already in memory, and Status.
   - Use the existing stored values: `todo`, `in-progress`, `done`; priority `none`, `low`, `medium`, `high`.
   - Title validation rejects whitespace-only values and preserves original text, including multiline input. Apply only approved additional validation.
   - Use quick chips Today, Tomorrow, Next week, No date, plus native date/time inputs. Do not build the custom calendar shown in the picker frame.
   - Preserve consistent `dueDate`/`dueHasTime` values, including clearing dates/times and the end-of-day rule. Use Q05 for unresolved calendar semantics.
   - The form includes the specified editable Project/Status fields; what constitutes a “move” and its activity/completion effects follows Q07, with row-action availability following Q13.
   - Desktop uses the designed centered modal; phone uses the bottom sheet. Show errors under their fields and include Delete task in edit mode.
   - Trap focus, support Escape, label controls/errors, and return focus to the trigger; if it disappeared, use Q12’s selected replacement.

8. Wire Quick Add and existing CRUD entry points.
   - Remove G2’s inert `aria-disabled` treatment/suppression from ready-state Quick Add, sidebar/drawer New project (`Navigation.tsx:20`), first-run “Create your first project,” and empty-project “Add a task.” Apply Q12’s selected loading/load-error treatment separately.
   - Wire globally specified topbar Add task/project creation, project edit/delete, and the project’s final add-task row. Make row completion/edit/delete live only on routes approved by Q13; move/event semantics follow Q07.
   - Quick Add uses a desktop popover and phone sheet above the keyboard. Enter adds; Escape closes.
   - Defaults specified by SCREENS remain: no due date, no priority, current project or otherwise last-used project. Apply Q04 to unspecified persistence/fallback behavior.
   - Open New project first only when projects are server-confirmed empty; Q12 governs unresolved/error states, and Q04 governs return/draft behavior.
   - Preserve the title when opening More options. On valid Enter submission, clear the title immediately and keep focus; never defer clearing to server acknowledgement or toast timing. Q08 governs later rejection recovery without overwriting subsequent input.
   - Measure Enter to visible optimistic task paint through the actual store/listener path using Q14’s approved protocol.
   - Preserve list padding around the floating button and make row actions available through keyboard focus as well as hover.
   - Apply shared row CRUD only where Q13 approves it; otherwise preserve Dashboard/My Tasks read-only rows. Do not implement G4 dashboard behavior or G5 filtering/sorting/search.

9. Build dialogs, toasts, and accessible overlay behavior.
   - Destructive confirmations show the item name and affected task count; pending-task inclusion follows Q08/Q12.
   - Use tokens for colors, geometry, typography, focus, and motion. Maintain at least 44 px targets at both widths.
   - Preserve focus through picker → form → confirmation transitions and through the phone drawer where applicable. Dismissal must not leave focus in an unmounted overlay.
   - Toasts: desktop bottom-left, phone above tab bar/floating button; one visible, up to three queued, five-second duration paused on hover/focus. Normal messages use `role="status"`; errors use `role="alert"` and remain until dismissed.
   - Use designed copy “Task added to {project}”, “Task deleted”, and “Could not save your change”; only undesigned copy requires Q08 approval.
   - Follow Q08’s timing, copy, and recovery policy. No Undo or new banner/alert system.

10. Review proposed rules tightening before editing `firestore.rules`.
    - Present the proposed diff, rationale, affected writes, and G2 query/document compatibility. **STOP — checkpoint 2:** report the diff before editing `firestore.rules`; wait for explicit owner review/approval before any rule edit or later step.
    - Keep Q03’s string limits, Q06’s creation-time equality, Q07’s activity enum, and Q09’s referential/cascade mechanism conditional on explicit decisions.
    - Preserve explicit owner-only validating matches, unmatched-path denial, immutable creation timestamps, and existing field contracts. Never add a broad allow that bypasses validation.
    - Preserve G2’s projects/tasks collection queries and activity `orderBy(createdAt, desc)` with `limit(20)`. Do not require query filters or extra listeners to accommodate new write rules.
    - Owner report, 2026-10-24: “I looked at the Firebase console Firestore Data tab, read-only, and the real project has no collections or documents.” Real-project legacy compatibility therefore reduces to this owner-reported fact, not a new confirmation request. Keep it here; do not update `docs/DECISIONS.md` before Q01’s restructure.
    - Existing read rules are ownership-only (`firestore.rules:53,59,67`): tightening write conditions cannot make documents unreadable; it can reject legacy updates. Codec enum tightening is a different readability risk: `decodeActivity` can throw/kill its stream, and e2e fixtures use `type: 'seeded'`. Keep G2-shaped fixture/query coverage and approve any codec/fixture change with Q07; do not silently enforce a new codec enum.
    - If approved rules use lookups, test a maximum-size planned batch with real rules: limits are 10 document-access calls per operation and 20 per atomic batch; do not assume repeated lookups are free. PLAN’s ≤500 operations remains binding even though current Firebase docs emphasize request-size limits. [Firebase rules limits for atomic operations](https://firebase.google.com/docs/firestore/manage-data/transactions#security_rules_limits).
    - Preview and Production share one Firebase project. Rule deployment and rollback affect both. The owner deploys reviewed rules; the agent never deploys, rolls back, or changes console settings.

11. Add meaningful unit, component, and rules coverage.
    - Test validation, dates/end-of-day behavior, approved defaults, completion transitions, activity planning, and total-operation batch partitioning.
    - Test mutation encoding, pending/server timestamp reconciliation, required activity failure, duplicate submission, retry identity, rejection recovery, and stale-session results.
    - Test form modes, field errors, More options title preservation, no-project flow, working first-run/empty-project actions, toasts, and overlay focus behavior.
    - Test cascade boundaries and Q09’s selected failure/retry contract, including activity in batch counts. Test Q11’s pending departure/sign-out behavior and Q12’s readiness/destinations only after approval; no hidden race-free requirement.
    - Extend rules tests only after the reviewed policy is approved: valid owner writes, signed-out/other-user denial, immutable creation time, and each approved tightening.
    - Retain G2 query/document compatibility tests and genuine malformed-document failures.
    - Preserve listener lifecycle, bounded frame batching, stable unchanged rows, and memoized navigation/drawer behavior. Do not write tests that select unanswered recommendations.

12. Add emulator-backed browser coverage.
    - Reuse the existing isolated demo project, Auth/Firestore runner, rules fixtures, explicit emulator flags, and seeded 1,000-task fixtures.
    - Cover project CRUD, task CRUD/completion and Q07-approved moves, Quick Add, More options, first-run/empty-project entry points, and failed saves; row mutation coverage follows Q13.
    - Verify real local pending → server-confirmed/rejected snapshots through the codec; mocks alone do not establish installed-SDK behavior.
    - Use separate authenticated contexts for synchronization, Q09’s selected cascade behavior, and actual pending-write/sign-out/reconnect/account-switch outcomes under Q11. These supplement Q14’s required manual second-device check.
    - Retain exactly three healthy handles/registrations through writes, project changes, navigation, and recovery.
    - Capture G3 states at 390 and 1280 px; check overflow, keyboard operation, focus return, target sizes, announcements, and console errors.
    - Keep observation/failure controls test-only and absent from normal production bundles. Never add a production bypass or live-project test fallback.

13. Measure optimistic writes, navigation, and bundle impact.
    - Once Q14 is answered, record every Quick Add Enter-to-visible-paint sample and apply only its approved protocol with strict `< 100 ms`; do not invent a percentile.
    - Keep three navigation speed runs of at least 60 trusted-click transitions each, 1,000 tasks, 4× CPU, tracing off, and the established two-frame commit/paint measurement.
    - Settle Auth, initial streams, fonts, and session-lazy modules before cached-navigation timing. Keep warmup costs separate in evidence; Production startup measurement remains conditional on Q10.
    - Retain every raw sample with sequence, actual source/destination route, and duration. Report each run’s median/p95/max, total and slow counts per route pair, and every transition over 100 ms, distinguishing first and repeat visits.
    - Apply nearest-rank `p95 < 100 ms` to each run. Do not pool runs to hide failure, introduce a per-pair/max gate, discard samples, or rerun unchanged code until it passes.
    - G2 retained 18 runs: 17 passed, one failed at p95 104.8 ms. Its cause remains unproven. Carry the thin margin on `/tasks` and project routes, including repeated project visits.
    - If reproduced, preserve the failed evidence first. Use separately labeled profiling/long-task/render/layout/GC and transport observations to investigate first/repeat visits, selectors, row stability, virtualization, and frame publication. Diagnostic tracing must not replace untraced acceptance samples. Validate a concrete change and retain both results.
    - Record every request start in click-to-paint windows and established transport separately. Navigation-caused requests/new channels fail; uncertain attribution is UNVERIFIED. Never blanket-exclude Firestore traffic.
    - Measure the normal production build using deduplicated entry + transitive static imports + HTML modulepreloads. Report initial/deferred/total bytes and deltas from 127,820 / 137,162 / 264,982 B.
    - Reject any Firestore runtime in that initial graph regardless of filenames. Preserve test-observer absence checks and the strict initial `< 200,000 B` budget.

14. Record manual synchronization and, only if Q10 includes it, Production first-data measurements.
    - Follow Q14’s approved manual protocol on two real signed-in devices; measure sender action → receiver-visible change without refresh for the selected write flows.
    - Record sample counts, fixture counts, browser/devices, CPU/network, timing method, every result/failure, and the approved “within 1 s” pass rule. Context/emulator tests do not replace the manual check; it blocks G3 completion under the owner’s revision request dated 2026-10-24, not an explicit PLAN §10 G3 rollout condition.
    - The following Production capture bullets apply only if the owner includes the measurement through Q10 and real data exists; otherwise report Q10 as pending or record the owner’s actual deferral, without a failed latency target. No seeding/settings changes are implied.
    - Record URL/build identity, actual project/task/activity counts, data characteristics, browser/device, network/CPU, and session/cache conditions.
    - Measure navigation/startup → resolved Auth, resolved Auth → confirmed project/task data, and confirmed data → visible data paint. Record activity confirmation separately; it must not become a new view gate.
    - Record lazy chunk download/transfer, listener registration, available callback/publication timings, and server-confirmation events. Do not sum overlapping intervals or label unisolated SDK time as codec time.
    - Preserve the existing confirmation/error/recovery behavior during measurement. Do not preload Firestore, change listeners, extend timeouts, or optimize against an invented target.
    - If Q10 includes the measurement but capture is unavailable, record latency UNVERIFIED and the missing access/data/method. G2’s 8,035 ms emulator observation is measurement-only, not a Production prediction.

15. Prepare the owner rollout and real-write verification handoff during implementation.
    - Write `docs/qa/gate-3/ROLLOUT.md` using G2’s layout, with exactly one owner-action row for each (a)–(f) below, in that order. Each row starts UNVERIFIED until the owner reports its result; report setup results separately within their corresponding rows. Carry the separate read-only empty-database record from step 10 as VERIFIED by owner on 2026-10-24; no repeat confirmation is needed.
    - **(a) Auth setup, before preview sign-in:** the owner authorizes the stable G3 branch alias host in Firebase Auth—exact host only, never all of `vercel.app`—while preserving the Google provider setup and no COOP header. G3 setup remains UNVERIFIED until reported; G2’s verification does not verify the G3 host.
    - **(b) Emulator flags:** the owner confirms both `VITE_USE_AUTH_EMULATOR` and `VITE_USE_FIRESTORE_EMULATOR` are still unset in Vercel Preview and Production; UNVERIFIED until reported.
    - **(c) Shared project, before rules deployment:** the owner confirms `VITE_FIREBASE_PROJECT_ID` is still identical in Preview and Production; UNVERIFIED until reported. The recorded shared project means rules deployment/rollback affects both. G2 code in Production only reads: tightening write conditions while preserving read rules does not affect those reads.
    - **(d) Rules review/deployment:** record the reviewed diff and, only if changes are approved, the owner’s deployment: `firebase deploy --only firestore:rules --project <id>`. A plain Firestore deployment can also push indexes; use rules-only. The owner confirms published timestamp/text in the console Rules tab; leave deployment/publication UNVERIFIED until reported. Rollback is owner redeployment of reviewed G2 rules from merge `0374036`; the agent never deploys or rolls back. If rules are unchanged, record that fact without claiming a new deployment.
    - **(e) Preview and second-device verification:** after setup, the owner checks real Google sign-in and real writes—create a project, Quick Add a task, edit, complete, move per Q07, delete a task, delete the project—with zero console errors, and reports step 14’s manual second-device timing. Record URL/build/device/conditions and separate results for both checks; this row stays UNVERIFIED until both are reported. Both block marking G3 complete by the owner’s revision request dated 2026-10-24; this condition is not yet in PLAN §10 G3.
    - **(f) Production after merge:** record the owner’s real Google sign-in, `/tasks` deep link, expected data/state, console result, and deployment identity; UNVERIFIED until reported. This handoff does not authorize agent configuration changes, merge, or release work.

16. Finish checks, evidence, and review.
    - Store G3 measurements and screenshots under `docs/qa/gate-3/` without overwriting G0–G2 or earlier failed G3 evidence.
    - Record decisions only in Q01’s approved structure. Carry the stale docs/decisions/g0-g2.md “not applied” correction into that restructure; leave the log unchanged in this revision.
    - Reassess the production dependency/module evidence after adding write exports. Record audit findings and browser reachability; do not run automatic dependency fixes or change the Firebase pin.
    - Run exit commands, fix failures, then run the `review` skill. Retain its required speed results too; a later passing run does not erase an earlier failure.
    - Update `docs/TRACKER.md` accurately after implementation. Never mark required targets complete while failed or unverified.
    - Stop and report if a fix fails twice. Propose AGENTS/PLAN changes only; never edit those files.
    - Do not commit, push, deploy, or perform external rollout actions without the applicable owner authorization.

## Exit commands

Run `java -version` before emulator-dependent checks.

```text
npm run build
npm run lint
npm run typecheck
npm run test
npm run test:rules
npm run e2e
npm run measure:bundle
```

All required commands must pass. `e2e` includes existing authenticated shell/sync coverage, G3 behavior, and three strict navigation speed runs. Report a missing command instead of guessing an invocation.

Inspect runtime Firestore imports and listener registrations:

```text
rg -n 'firebase/firestore' src
rg -n 'onSnapshot' src
rg -n 'collectionGroup|getDocs?\b|getCountFromServer' src
```

Inspect every match. Runtime Firestore imports belong only inside the lazy boundary; type-only imports are distinct. Listener registrations belong only under `src/lib/subscriptions`. Source searches supplement the production module-graph assertion.

Repeat the existing production test-observer absence checks and run:

```text
npm audit --omit=dev
rg -i "grpc" dist
```

Record audit exit status/findings and actual browser-module reachability. For searches, exit 1 means no matches; exit 2 is an error. A string match or its absence alone does not establish vulnerability reachability.

`measure:firestore-adapter` is intentionally not a G3 exit: it is the G2 baseline probe pinned to scaffold `9a111e7` and writes G2 evidence. Propose a gate-specific correction to CONTEXT §8; do not run/rewrite that probe or edit CONTEXT in this revision.

Run `review` after gate checks pass. Apply Q14’s approved manual pass protocols; preview/second-device checks block completion by the owner’s revision request dated 2026-10-24, not current PLAN §10 G3 wording. Q10 alone determines whether Production first-data measurement occurs, always without a latency pass/fail target. No Lighthouse, LCP, INP, G4 UI, G5 features, or G6 release work becomes a G3 pass condition.

## Report

- Changed files and resulting project/task/Quick Add behavior.
- Command results with test counts and durations; each required target met, failed, or unverified.
- All optimistic-write/second-device samples and Q14’s actual approved pass protocols; Q07 activity contract, cascade batch counts, and Q09/Q11 failure, concurrency-limit, and unsynced-write results.
- Initial/deferred/total bytes and baseline deltas; production graph and dependency findings.
- Every speed run’s sample count, median/p95/max, per-route-pair counts, every transition over 100 ms, request attribution, and retained failures/diagnostics.
- Production first-data measurement only if included by Q10: conditions/results or UNVERIFIED; otherwise the actual pending/deferral decision. No invented threshold.
- Layout/focus/keyboard evidence; reviewed rules changes, the owner-reported empty database, codec/fixture compatibility, and `docs/qa/gate-3/ROLLOUT.md` owner verification/deployment/rollback statuses.
- What was not done, all unanswered OPEN questions, Q01’s restructure/stale-wording correction, and proposed AGENTS/PLAN changes. Propose adding the no-COOP rule to AGENTS and making CONTEXT §8’s adapter command gate-specific; edit none of those files here.
- Proposed G3 PLAN wording (owner revision request, 2026-10-24; mirrors §10’s G2 rollout paragraph): “In G3, after review and before merge, the owner deploys reviewed owner-only Firestore rules if changed and verifies the approved G3 write flows on the Vercel preview with real Google sign-in. The preview and manual second-device checks block marking G3 complete. The owner verifies Production after merge. These checks remain UNVERIFIED until the owner reports them. The agent never deploys rules. G6 retains final deployment verification.” Propose only; do not edit PLAN.
- Append up to five dated G3 lessons after implementation; do not present recommendations as owner decisions.

## Lessons

### Carried lessons

- G0/G1: preserve strict thresholds, untraced timing, failed evidence, stable rows, and explicit dialog focus handling.
- G2: pending server timestamps require deliberate snapshot decoding before product writes.
- G2: preserve the lazy Firestore graph and report initial, deferred, and total JavaScript.
- G2: the retained route-speed failure remains unexplained, including slow repeat project visits.
- G2: Preview and Production share rules; only the owner deploys. Functional Production verification does not establish populated first-data latency.

### G3 lessons

(none yet)
