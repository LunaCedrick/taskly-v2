# PROMPTS.md: copy and paste prompts (for the owner, not for the agent)

This file is not loaded by Codex. Paste the prompts into a NEW Codex session. Replace the words in <angle brackets>.

## Gate values
| Gate | SKILL | BRANCH |
|---|---|---|
| G0 | g0-shell-and-speed | gate-0-shell-speed |
| G1 | g1-auth | gate-1-auth |
| G2 | g2-store-and-sync | gate-2-store-and-sync |
| G3 | g3-projects-tasks | gate-3-projects-tasks |
| G4 | g4-dashboard | gate-4-dashboard |
| G5 | g5-search-alerts | gate-5-search-alerts |
| G6 | g6-qa-and-deploy | gate-6-qa-deploy |

## Setup (A5 to A8)
A5, in a terminal (not a prompt):
```
# old repo
git tag v1-prototype && git push origin v1-prototype
# new repo: unzip the starter pack into an empty folder, then
git init && git add . && git commit -m "chore: starter pack" && git branch -M main
git remote add origin <NEW_REPO_URL> && git push -u origin main
```

A8, first Codex session:
```
Do not change any files. Tell me: (1) the last heading of AGENTS.md you can see, (2) every skill you can see with its name and description, (3) the size of AGENTS.md in bytes as you received it.
```
Expected: last heading "Reports", eight skills.

## 1. Expand an outline skill (only G1 to G6, before that gate)
```
Read AGENTS.md and .agents/skills/<SKILL>/SKILL.md. The skill is an outline. Write a full version in the same layout as g0-shell-and-speed: numbered steps, the exact files to create, the tests to write, the exit commands, and the Lessons section. Read only the plan and screens sections the outline names. Do not write app code. Show me the full skill text and wait for my approval.
```
After you approve:
```
Approved. Replace the contents of .agents/skills/<SKILL>/SKILL.md with the approved text and change its Status from outline to full. Commit only that file on a branch named skill-<gate>. Change nothing else.
```

## 2. Start a gate
```
Read AGENTS.md. Use the <SKILL> skill. Work on a new branch named <BRANCH>. Before writing any code, propose a plan: the files you will create or change, the order of the steps, how you will meet each target, and any risk or question. Do not start coding until I approve.
```
Extra line for G1 and G2, add at the end:
```
The Firebase configuration is in .env. Never print it, never commit it. For tests, use the Firebase emulator, never production data.
```

## 3. Approve or adjust the plan
```
Plan approved. Build it in small commits. If you find something that the plan or docs/SCREENS.md does not cover, stop and ask me instead of deciding.
```
or
```
Adjust the plan: <your change>. Show me the updated plan and wait.
```

## 4. Finish a gate
```
Run this gate's exit commands and the review skill. Then report in this format: Changed (a few lines); Results (each command and each target with its number, met or not met); Not done; Open questions; Proposed changes to AGENTS.md or docs/PLAN.md (do not apply them). Then append up to five dated lessons to the Lessons section of the <SKILL> skill.
```

## 5. Pull request
```
Open a pull request from <BRANCH> to main. If you cannot, write the pull request description instead. Include: what changed, how to run it, the result of every target, screenshots at 390 and 1280 px wide, and the open questions. Do not merge.
```

## 6. Ask Claude to review (paste in the Claude chat)
```
Review the branch <BRANCH> of <REPO_URL> against docs/PLAN.md section 10 (<GATE>), docs/SCREENS.md, and the hard rules in AGENTS.md. List: rule violations, targets not met or not proven, things built that are not in scope, risks, and what to fix before merge. Be specific with file names.
```
(If the repo is private, paste the output of `git diff main...HEAD` instead.)

## 7. Fix a failing check
```
The check <COMMAND OR TARGET> fails with: <PASTE ONLY THE FAILING LINES>. Find the cause before changing anything. Explain it in two sentences, propose the smallest fix, then apply it and rerun the check. If the fix fails twice, stop and report what you tried.
```

## 8. Speed regression
```
Navigation got slower: the speed test reports <NUMBER> ms at the 95th percentile. Compare it with the numbers in docs/DECISIONS.md. Use a browser performance profile to find the cause, tell me what you found, then fix it and rerun the speed test. Do not weaken the test or the budget.
```

## 9. Scope check (any time, or when a branch feels big)
```
List everything you built in this branch that is not described in docs/PLAN.md sections 3 and 4 or docs/SCREENS.md. For each item, say why you added it. Do not remove anything yet.
```

## 10. After the merge
```
Update docs/TRACKER.md: tick this gate, and add a log line with today's date and the measured numbers (route-change times, bundle size, Lighthouse scores). Change nothing else. Commit on main with the message "docs: tick <GATE>".
```
Then start a NEW Codex session for the next gate.

## 11. Apply an approved rule change
```
Apply only these approved changes to AGENTS.md: <list>. Keep the file under 8 KB. Add one line for each change to docs/DECISIONS.md with today's date and the reason.
```

## 12. If a session gets long or confused
```
Stop. Summarize in ten lines: what is done, what is in progress, what is broken, and the next step. Do not change any files.
```
Then copy the summary, open a NEW session, and start with: "Read AGENTS.md. Use the <SKILL> skill. Continue from this summary: <paste>."

## Order of use
A5 setup, A8 check, then for each gate: 1 (G1 to G6 only), 2, 3, build, 4, 5, 6 (Claude), fix with 7 to 9 as needed, merge, 10. Rule changes use 11.
