# DECISIONS.md

Index of Taskly's decision records: measurements, owner decisions, and the reasons behind them.
A decision may change when a measurement says so. Write the change in the current gate's file first.

## Files

| File | Covers | Status |
|---|---|---|
| [decisions/g0-g2.md](decisions/g0-g2.md) | G0–G2 history: early decisions, Gate 0–2 measurements, G2 owner decisions and rollout records | Frozen. Byte-identical move of the former `docs/DECISIONS.md`; line numbers preserved |
| [decisions/g3.md](decisions/g3.md) | G3 records | Owner-approved, 2026-10-24 |

## Rules

- New gate records go in `docs/decisions/gN.md`, one file per gate.
- Each file stays within the 300-line limit.
- Attribute a decision to the owner only if the owner actually made it. Mark agent proposals and measurements as such.
- Do not rewrite frozen files. Record corrections below instead.
- Older references to `docs/DECISIONS.md` with line numbers or anchors point to `decisions/g0-g2.md`.

## Corrections

- `decisions/g0-g2.md` lines 292–294 say the PLAN wording changes are "not applied". They were applied on 2026-10-24 in commit `6a8144d`.
