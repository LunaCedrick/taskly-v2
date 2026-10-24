# G3 approved activity contract

The owner approved the implementation-plan matrix on 2026-10-24 (P2), removing
`task.updated`. This records the approved writer contract; it does not introduce an
activity UI or an enum restriction in the reader or rules. Types remain strings.

| Type | Trigger | Text | taskId | projectId |
|---|---|---|---|---|
| task.created | Task created | Added {task} to {project} | New task | Destination |
| task.completed | Entering Done | Completed {task} | Task | Final project |
| task.status_moved | Other status change, including reopening | Moved {task} to {status label} | Task | Final project |
| task.project_moved | Project changes | Moved {task} from {old project} to {new project} | Task | Destination |
| task.deleted | Single-task deletion | Deleted {task} | Deleted task | Previous project |
| project.created | Project created | Created the project {name} | null | New project |
| project.renamed | Project renamed | Renamed the project {old name} to {new name} | null | Project |
| project.deleted | Cascade final batch | Deleted the project {name} | null | Deleted project |

- Ordinary title/description/category/priority/due edits produce no activity.
- A simultaneous project/status change plans project movement before completion/status
  movement. Entering Done emits completion, not an additional status move. Creating a
  task already Done emits created then completed. No task.updated follows either flow.
- Checkbox: any non-Done status → Done; Done → To do. Entering Done sets server
  completedAt, reopening clears it, and other completed-task edits preserve it.
- No-op changes write neither entities nor activity. A case-only rename is a change;
  an identical stored name is a no-op. Mutation and required events share one batch.
- One client operation and its retries reuse their task/project/event IDs. Cross-device
  exactly-once cascade summaries are not guaranteed (accepted owner P3/Q09 limitation).
- Cascade task batches have no per-task activity. The final project removal and its
  summary (taskId null) are atomic; the multi-batch cascade as a whole is not atomic.

## Checkpoint 1 visual comparison

Viewed `docs/design/dashboard.png` directly on 2026-10-24:

| Frame text | Approved matrix | Result |
|---|---|---|
| You completed Deploy weather dashboard | Completed {task} | MISMATCH: frame includes “You ” |
| Added Review Chapter 4 draft to Thesis | Added {task} to {project} | Matches |
| Moved Build Firestore CRUD module to In progress | Moved {task} to {status label} | Matches |
| Created the project Personal | Created the project {name} | Matches |

The frame supplies no examples for project movement, rename, or deletion. Their approved
plan copy remains unchanged. Owner Q16 keeps “Completed {task}”; the “You completed”
frame is a known design deviation for G4 and is not changed in G3. No G4 UI is implemented.
