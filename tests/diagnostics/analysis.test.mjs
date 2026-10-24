import { test } from 'node:test'
import assert from 'node:assert/strict'
import { summarize, unionMs, partitionMs } from './analyze-speed.mjs'

test('nearest-rank pooled statistics retain slow repeats, including older main samples without sequence fields', () => {
  const result = summarize([{ transitions: [
    { from: '/', to: '/tasks', milliseconds: 100 },
    { from: '/tasks', to: '/projects/project-1', milliseconds: 101 },
    { from: '/projects/project-1', to: '/tasks', milliseconds: 80 },
    { from: '/tasks', to: '/projects/project-1', milliseconds: 120 },
  ] }])
  assert.equal(result.shareOver100, .5)
  assert.equal(result.pooledP95, 120)
  assert.equal(result.pooledP99, 120)
  assert.equal(result.slowRepeatTasksProject, 1)
})
test('nested trace intervals are unioned, not double counted', () => {
  assert.equal(unionMs([[1000, 3000], [2000, 2500], [4000, 5000]]), 3)
})
test('exclusive buckets subtract rendering and GC from enclosing script intervals', () => {
  assert.deepEqual(partitionMs({ scripting: [[1000, 6000]], rendering: [[2000, 3000]], gc: [[4000, 4500]] }, 0, 7000),
    { scripting: 3.5, rendering: 1, gc: .5, unclassified: 2 })
})
