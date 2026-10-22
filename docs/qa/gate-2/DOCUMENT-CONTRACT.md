# Gate 2 document contract

This records the field matrix from the step-1 implementation plan accepted by owner P3 on
2026-10-22, with P1/P4's date and title clarifications. It is an agent-authored record of that
approved plan, not new owner wording. See [owner decisions](../../DECISIONS.md#g2-owner-decisions-2026-10-22).

Every field below is required, including fields whose value may be null. No fields are optional.
Reject keys outside these allowlists. Document IDs come from paths; neither `id` nor `uid` is
stored in a payload. Updates validate the full resulting document, and every `createdAt` is
immutable on update.

| Document | Field | Required | Stored value |
|---|---|---|---|
| Project | `name` | Yes | String |
| Project | `colorIndex` | Yes | Integer 0–5, tied to the existing six-color palette |
| Project | `createdAt` | Yes | Timestamp; immutable |
| Project | `updatedAt` | Yes | Timestamp |
| Task | `projectId` | Yes | Non-null string; missing referenced projects are orphans |
| Task | `title` | Yes | String containing at least one non-whitespace character |
| Task | `description` | Yes | String; empty allowed |
| Task | `category` | Yes | String; empty allowed |
| Task | `dueDate` | Yes | Timestamp or null |
| Task | `dueHasTime` | Yes | Boolean |
| Task | `priority` | Yes | `none`, `low`, `medium`, or `high` |
| Task | `status` | Yes | `todo`, `in-progress`, or `done`; no mapping layer |
| Task | `createdAt` | Yes | Timestamp; immutable |
| Task | `updatedAt` | Yes | Timestamp |
| Task | `completedAt` | Yes | Timestamp or null |
| Activity | `type` | Yes | String; no activity enum until G3 defines writers |
| Activity | `taskId` | Yes | String or null |
| Activity | `projectId` | Yes | String or null |
| Activity | `text` | Yes | String |
| Activity | `createdAt` | Yes | Timestamp; immutable |

Dates are Firestore timestamps on disk and numeric milliseconds in the UI, decoded structurally
without importing the runtime `Timestamp` class into the initial application graph. Non-nullable
timestamp fields containing null are malformed in G2. P1 carries locally pending
`serverTimestamp` handling to G3, when product writers exist.

Title validation preserves the stored text, including surrounding whitespace and multiline
content. Only title has the approved nonempty rule. No string-length caps, timestamp-ordering
rules, referential writes/deletes, or other undocumented cross-field constraints are added.

Profile access at `users/{uid}` remains denied, including owner access. There is no profile
writer, profile listener, or prerequisite that a parent profile document exists.

P2 permits the intended G2 exceptions: the proposed PLAN clarifications, Q06's minimal
"Project not found" state with a Dashboard link, the title rule, and the literal `in-progress`
status. These do not authorize broader G3 CRUD or G6 page/release work. The proposed PLAN
wording remains a proposal for the owner; this record does not edit PLAN.

The original matrix was recovered from the accepted assistant plan at 2026-10-22 02:29:23 UTC
in the local Codex session transcript ending `01a15931-ba8f-7b02-ac4f-474db50c8f1d.jsonl`,
JSONL line 492. The persisted P3 approval is in `docs/DECISIONS.md`.
