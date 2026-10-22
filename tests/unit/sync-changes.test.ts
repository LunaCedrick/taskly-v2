import { describe, expect, it } from 'vitest'
import { makeFakeData } from '../../src/lib/fake-data'
import { applyChanges, effectiveDataEqual, type EntityChange } from '../../src/lib/sync-changes'
import type { Activity, Project } from '../../src/lib/types'

const { projects, tasks } = makeFakeData(3)

describe('incremental document changes', () => {
  it('keeps array and row identities for empty, missing-removal and duplicate effective changes', () => {
    expect(applyChanges(projects, [])).toBe(projects)
    expect(applyChanges(projects, [{ type: 'removed', id: 'absent' }])).toBe(projects)
    expect(applyChanges(projects, projects.map((data) => ({ type: 'modified', id: data.id, data: { ...data } }))))
      .toBe(projects)
  })

  it('applies adds, modifications and removals without changing the input or unaffected rows', () => {
    const added = { ...projects[0], id: 'new' }
    const modified = { ...projects[1], name: 'Changed', updatedAt: projects[1].updatedAt - 1 }
    const next = applyChanges(projects, [
      { type: 'added', id: added.id, data: added },
      { type: 'modified', id: modified.id, data: modified },
      { type: 'removed', id: projects[0].id },
    ])
    expect(next).toEqual([modified, projects[2], added])
    expect(next[1]).toBe(projects[2])
    expect(projects).toHaveLength(3)
    expect(projects[1].name).not.toBe('Changed')
  })

  it('upserts by id without duplicating documents and preserves modification position', () => {
    const added = { ...projects[0], id: 'new' }
    const next = applyChanges(projects, [
      { type: 'added', id: added.id, data: added },
      { type: 'added', id: added.id, data: { ...added, name: 'Latest' } },
      { type: 'modified', id: projects[1].id, data: { ...projects[1], name: 'Middle' } },
    ])
    expect(next.map(({ id }) => id)).toEqual([...projects.map(({ id }) => id), added.id])
    expect(next[1].name).toBe('Middle')
    expect(next[3].name).toBe('Latest')
  })

  it('compares every decoded field rather than treating updatedAt as a version', () => {
    const original = tasks[0]
    for (const [key, value] of Object.entries(original)) {
      const replacement = typeof value === 'string' ? `${value}-different`
        : typeof value === 'boolean' ? !value : value === null ? 1 : value - 1
      const data = { ...original, [key]: replacement }
      if (key === 'id') continue
      expect(effectiveDataEqual(original, data), key).toBe(false)
      expect(applyChanges([original], [{ type: 'modified', id: original.id, data }])[0], key).toBe(data)
    }
    expect(effectiveDataEqual(original, { ...original })).toBe(true)
  })

  it('collapses add/remove and changed/restored batches back to the original references', () => {
    const temporary = { ...projects[0], id: 'temporary' }
    expect(applyChanges(projects, [
      { type: 'added', id: temporary.id, data: temporary },
      { type: 'removed', id: temporary.id },
      { type: 'modified', id: projects[1].id, data: { ...projects[1], name: 'Intermediate' } },
      { type: 'modified', id: projects[1].id, data: { ...projects[1] } },
    ])).toBe(projects)
    expect(applyChanges(projects, [
      { type: 'removed', id: projects[1].id },
      { type: 'added', id: projects[1].id, data: { ...projects[1] }, newIndex: 1 },
    ])).toBe(projects)
  })

  it('honors sequential query indices even when the effective fields are unchanged', () => {
    const next = applyChanges(projects, [
      { type: 'modified', id: projects[2].id, data: { ...projects[2] }, oldIndex: 2, newIndex: 0 },
    ])
    expect(next).toEqual([projects[2], projects[0], projects[1]])
    expect(next[0]).toBe(projects[2])
    expect(applyChanges(next, [
      { type: 'modified', id: projects[2].id, data: { ...projects[2] }, newIndex: 2 },
    ])).toEqual(projects)
  })

  it('retains only the latest 20 activity rows after query additions and eviction', () => {
    const rows: Activity[] = Array.from({ length: 20 }, (_, index) => ({
      id: `activity-${index}`, type: 'anything', taskId: null, projectId: null,
      text: `${index}`, createdAt: 100 - index,
    }))
    const latest = { ...rows[0], id: 'new', createdAt: 101 }
    const next = applyChanges(rows, [
      { type: 'removed', id: rows[19].id, oldIndex: 19 },
      { type: 'added', id: latest.id, data: latest, newIndex: 0 },
    ], { limit: 20 })
    expect(next).toHaveLength(20)
    expect(next).toEqual([latest, ...rows.slice(0, 19)])
    expect(next[1]).toBe(rows[0])
    expect(applyChanges(rows, [{ type: 'added', id: latest.id, data: latest, newIndex: 0 }], { limit: 20 }))
      .toEqual(next)
    expect(applyChanges(rows, [], { limit: 20 })).toBe(rows)
    expect(applyChanges(rows, [], { limit: 0 })).toEqual([])
  })

  it('rejects malformed change data and invalid limits or target indices', () => {
    const malformed: EntityChange<Project>[] = [
      { type: 'added', id: 'missing' },
      { type: 'modified', id: 'wrong', data: projects[0] },
      { type: 'modified', id: projects[0].id, data: projects[0], newIndex: -1 },
      { type: 'modified', id: projects[0].id, data: projects[0], newIndex: 3 },
    ]
    for (const change of malformed) expect(() => applyChanges(projects, [change])).toThrow()
    for (const limit of [-1, 0.5, NaN]) expect(() => applyChanges(projects, [], { limit })).toThrow()
  })
})
