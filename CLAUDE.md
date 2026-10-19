# CLAUDE.md

@AGENTS.md

## Role in this repo
- Codex builds each gate. Claude Code plans, reviews and answers questions. The owner (Ced) merges.
- Do not commit or push to a gate-* branch while Codex is building it. Review read-only and give findings as a prompt for Codex.
- Never run git push --force, git reset --hard, or delete a branch without asking me first.

## Where things are
- Gate skills are in .agents/skills/<name>/SKILL.md. They are Codex's folder and are not auto-loaded here; read them by path.
- Plan, screens, design, decisions and tracker are in docs/. Gate evidence is in docs/qa/gate-N/.

## Machine constraints
- Port 8080 belongs to a company Oracle listener. Never stop or reconfigure it. Firestore emulator is 8081, Auth emulator is 9099.
- Never commit .env or real secrets. Never add a Cross-Origin-Opener-Policy header; it breaks Google sign-in.

## Reviewing a gate
- Re-run the gate's exit commands yourself, and say which results you ran and which you only read.
- Apply pass thresholds exactly as written in docs/PLAN.md (for example p95 < 100 ms is strict).
- Propose changes to AGENTS.md or docs/PLAN.md; never apply them.
