// Only the runner's explicit --record-evidence flag enables committed artifact updates.
export const QA_DIRECTORY = process.env.TASKLY_RECORD_EVIDENCE === 'true'
  ? 'docs/qa/gate-1'
  : 'test-results/gate-1'
