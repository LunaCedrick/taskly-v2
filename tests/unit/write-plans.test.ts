import { describe, expect, it } from 'vitest'
import { makeFakeData } from '../../src/lib/fake-data'
import { cascadePlan, defaultProject, deleteTaskPlan, nextColor, projectNameError, projectPlan, taskPlan } from '../../src/lib/write-plans'
import { SERVER_TIME } from '../../src/lib/mutations/types'

const { projects, tasks } = makeFakeData(1001)
const previous = tasks[0]
const { id: _id, createdAt: _created, updatedAt: _updated, completedAt: _completed, ...values } = previous
void [_id, _created, _updated, _completed]
let sequence = 0
const id = () => `generated-${sequence++}`
const events = (plan: ReturnType<typeof taskPlan>) => plan.filter((op) => op.stream === 'activity')
  .map((op) => op.kind !== 'delete' ? op.data.type : '')

describe('approved project policies', () => {
  it('preserves entered names, rejects empty/trimmed case duplicates, permits self/case renames', () => {
    expect(projectNameError(' \n', projects)).toBeTruthy()
    expect(projectNameError(' thesis ', projects)).toBeTruthy()
    expect(projectNameError('THESIS', projects, projects[0].id)).toBe('')
    expect(projectPlan('Thesis', projects, id, projects[0])).toEqual([])
    expect(projectPlan(' thesis ', projects, id, projects[0])[0]).toMatchObject({ data: { name: ' thesis ' } })
  })
  it('selects current, last-used, then oldest/id; reuses first unused then least-used color', () => {
    expect(defaultProject(projects, projects[1].id, projects[2].id)).toBe(projects[1])
    expect(defaultProject(projects, 'deleted', projects[2].id)).toBe(projects[2])
    expect(defaultProject(projects, 'deleted', 'deleted')).toBe(projects[0])
    expect(defaultProject([])).toBeUndefined()
    expect(nextColor(projects)).toBe(3)
    const six = Array.from({ length: 6 }, (_, colorIndex) => ({ ...projects[0], id: `${colorIndex}`, colorIndex }))
    expect(nextColor(six)).toBe(0)
    expect(nextColor([...six, six[0]])).toBe(1)
    expect(nextColor(six.filter((p) => p.colorIndex !== 2))).toBe(2)
  })
})

describe('activity and completion', () => {
  it('has no activity for ordinary edits, no writes for no-ops, preserves multiline title text', () => {
    expect(taskPlan(values, projects, id, previous)).toEqual([])
    expect(events(taskPlan({ ...values, description: 'changed' }, projects, id, previous))).toEqual([])
    expect(taskPlan({ ...values, title: ' \n retained \n' }, projects, id)[0]).toMatchObject({ data: { title: ' \n retained \n' } })
    expect(() => taskPlan({ ...values, title: '\n  ' }, projects, id)).toThrow('title')
  })
  it('orders project movement before completion and emits created+completed for a new Done task', () => {
    const changed = { ...values, projectId: projects[1].id, status: 'done' as const }
    const plan = taskPlan(changed, projects, id, previous)
    expect(events(plan)).toEqual(['task.project_moved', 'task.completed'])
    expect(plan[0]).toMatchObject({ data: { completedAt: SERVER_TIME } })
    expect(plan.slice(1)).toMatchObject([
      { data: { projectId: projects[1].id, taskId: previous.id } },
      { data: { text: `Completed ${previous.title}`, projectId: projects[1].id } },
    ])
    expect(events(taskPlan(changed, projects, id))).toEqual(['task.created', 'task.completed'])
  })
  it('reopens with a status event, clears completedAt, preserves it on other Done edits', () => {
    const done = { ...previous, status: 'done' as const, completedAt: 123 }
    const reopened = taskPlan({ ...values, status: 'todo' }, projects, id, done)
    expect(events(reopened)).toEqual(['task.status_moved'])
    expect(reopened[0]).toMatchObject({ data: { completedAt: null } })
    expect(taskPlan({ ...values, status: 'done', title: 'edit' }, projects, id, done)[0])
      .toMatchObject({ data: { completedAt: 123 } })
    expect(deleteTaskPlan(previous, id)).toHaveLength(2)
  })
})

it.each([0, 1, 499, 500, 501, 1001])('cascades %i tasks, <=500 total ops per batch, stable final summary identity', (count) => {
  const rows = Array.from({ length: count }, (_, index) => ({ ...previous, id: `task-${index}` }))
  const batches = cascadePlan(projects[0], rows, 'stable-summary')
  expect(batches.every((batch) => batch.length <= 500)).toBe(true)
  expect(batches.flat().filter((op) => op.stream === 'tasks')).toHaveLength(count)
  expect(batches.at(-1)).toMatchObject([
    { kind: 'delete', stream: 'projects', id: projects[0].id },
    { stream: 'activity', id: 'stable-summary', data: { taskId: null, type: 'project.deleted' } },
  ])
  expect(batches.flat().filter((op) => op.stream === 'activity')).toHaveLength(1)
})
