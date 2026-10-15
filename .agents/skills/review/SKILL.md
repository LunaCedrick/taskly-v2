---
name: review
description: "Use at the end of every Taskly gate, before opening the pull request, to run the quality checklist and record lessons."
---

# Review

Run this after the gate's own exit commands pass.

## Checks
1. Run `npm run lint && npm run typecheck && npm run test && npm run e2e`. Report any failure.
2. Hard rules, with commands (each result must be empty unless noted):
   - Listeners outside the subscriptions module: `grep -rn "onSnapshot(" src --include=*.ts --include=*.tsx | grep -v "src/lib/subscriptions"`
   - Hard-coded colors outside tokens: `grep -rnE "#[0-9a-fA-F]{3,8}\b" src --include=*.ts --include=*.tsx --include=*.css | grep -v "tokens.css"`
   - Files over 300 lines: `find src -name "*.ts*" -o -name "*.css" | xargs wc -l | awk '$1>300 && $2!="total"'`
   - Loose types and leftovers: `grep -rnE "\bany\b|console\.log|TODO" src`
3. Performance: rerun the speed test and compare with the numbers in `docs/DECISIONS.md`. Report both.
4. Layout: take screenshots at 390 and 1280 px. Check there is no horizontal scroll and that Tab reaches every control.
5. Diff: read `git diff main...HEAD --stat`. Flag changes unrelated to this gate.

## Report format
- Changed: files and behavior, in a few lines
- Results: each command and its numbers
- Not done: plainly
- Open questions
- Proposed changes to `AGENTS.md` or `docs/PLAN.md` (do not apply them)

## Lessons
At the end, add up to five dated one-line lessons to the "Lessons" section of the gate skill you used.
Lessons are things a future session should know, such as a trap or a faster way. Keep them short.

## Lessons (for this skill)
(none yet)
