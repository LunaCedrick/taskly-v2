# G3 checkpoint 1

Status: IN PROGRESS. Owner authorized implementation through steps 3–4 only on 2026-10-24.
Baseline app revision: `d16fe58` (main); owner answers first committed as `213f134`.

## Scope

Lazy mutation transport and pending timestamp handling; real SDK queue/sign-out/reconnect
experiments before guards. No CRUD interface, guard, rules edit/deploy, dependency install,
Production measurement, or later-gate feature is authorized by this checkpoint.

## Baseline and carried evidence

- [baseline-bundle.json](baseline-bundle.json) and [baseline-production-graph.json](baseline-production-graph.json)
  are from the unchanged app with G3 artifact routing, before mutation integration.
- G2 final baseline: initial 127,820 / deferred 137,162 / total 264,982 B gzip.
  Fresh baseline: 127,820 / 137,170 / 264,990 B; deltas 0 / +8 / +8 B.
  Initial graph contains no Firestore runtime. Only initial has a byte cap: strictly <200,000 B.
- Historical G2 evidence mismatch: `docs/qa/gate-2/bundle.json` lists the final four chunks,
  including entry `index-BEzxPrzy.js`; `production-bundle-graph.json` instead describes a
  single entry `index-bUZJVBSx.js` with no import/dynamic edges. These are different assets;
  their cause is unproven. G2 evidence stays unchanged. Fresh G3 graph hashes are validated
  against the emitted JS and HTML before measurement.
- G2 retained 18 speed runs: 17 passed, one p95 104.8 ms failure. Thin margins include
  `/tasks` and repeat project visits; cause remains unproven. Retain all G3 runs, per-pair
  counts and every transition >100 ms; never rerun unchanged code until it passes.
- Production populated first-data latency remains unverified and deferred by owner Q10
  until after G3 merges. G2's 8,035 ms emulator result is measurement-only.

## Accepted limits and deferred behavior

- Q09: task-first/project-last deletion, explicit retry of remaining tasks. Partial failures
  preserve acknowledged deletes. A dismissed overlay does not stop an in-flight cascade.
  Navigate to Dashboard after completion only if still on the deleted project's route.
  The owner accepts the narrow cross-device orphan race and does not require cross-device
  exactly-once cascade summaries. One client operation and its retries reuse event identity.
- P2: no activity for ordinary task edits; no `task.updated`. Types remain strings in reader
  and rules. Approved event texts are compared to `dashboard.png` at this checkpoint.
- P5: no unload/sign-out guards before owner reviews actual SDK experiment results.
- P6: later task entry points require healthy, confirmed projects AND tasks; destructive
  confirmations wait for relevant pending task writes and recompute their counts.
- The frozen G2 adapter probe and its regression test are intentionally excluded from G3's
  default checks. No G0–G2 evidence is regenerated. Browser runs use unique G3 directories.

## Proposed documentation changes (not applied)

- AGENTS: add the existing no-COOP rule; Google popup sign-in breaks with that header.
- PLAN: for G3, task row mutations are live only on Project view, overriding “from any
  screen”; global Quick Add, topbar add, and project creation remain available (owner P1).
- PLAN G3 rollout addition, owner-requested 2026-10-24: “In G3, after review and before
  merge, the owner deploys reviewed owner-only Firestore rules if changed and verifies the
  approved G3 write flows on the Vercel preview with real Google sign-in. The preview and
  manual second-device checks block marking G3 complete. The owner verifies Production
  after merge. These checks remain UNVERIFIED until the owner reports them. The agent
  never deploys rules. G6 retains final deployment verification.”
- CONTEXT §8: make the adapter measurement command G2-specific; G3 uses its approved
  exit commands and its actual normal production graph. No new later-gate metrics.

Checkpoint results will be appended after verification; this record does not mark G3 complete.
