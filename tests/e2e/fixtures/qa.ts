// Only the runner's explicit --record-evidence flag enables committed artifact updates.
const base = process.env.TASKLY_RECORD_EVIDENCE === 'true' ? 'docs/qa/gate-3' : 'test-results/gate-3'
// Each harness invocation retains its own samples, including failed runs.
export const QA_DIRECTORY = `${base}/${process.env.TASKLY_EVIDENCE_RUN ?? 'manual'}`
