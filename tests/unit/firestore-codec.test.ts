import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { decodeActivity, decodeDocument, decodeProject, decodeTask } from '../../src/lib/firebase/firestore-codec'
import { effectiveDataEqual } from '../../src/lib/sync-changes'

const stamp = (seconds = 100, nanoseconds = 250_000_000) => ({ seconds, nanoseconds })
const project = () => ({ name: '', colorIndex: 0, createdAt: stamp(), updatedAt: stamp() })
const task = () => ({
  projectId: 'project', title: 'Task', description: '', category: '', dueDate: null,
  dueHasTime: false, priority: 'none', status: 'todo', createdAt: stamp(),
  updatedAt: stamp(), completedAt: null,
})
const activity = () => ({ type: '', taskId: null, projectId: null, text: '', createdAt: stamp() })
const contracts = [
  { name: 'project', fixture: project, decode: decodeProject },
  { name: 'task', fixture: task, decode: decodeTask },
  { name: 'activity', fixture: activity, decode: decodeActivity },
]

describe('Firestore document contracts', () => {
  it('decodes structural timestamps to numeric milliseconds without a Timestamp class', () => {
    expect(decodeProject('p', project())).toEqual({
      id: 'p', name: '', colorIndex: 0, createdAt: 100_250, updatedAt: 100_250,
    })
    expect(decodeTask('t', { ...task(), dueDate: stamp(-1, 500_000_000), completedAt: stamp(0, 1) }))
      .toMatchObject({ dueDate: -500, completedAt: 0.000001 })
    expect(decodeActivity('a', activity())).toEqual({
      id: 'a', type: '', taskId: null, projectId: null, text: '', createdAt: 100_250,
    })
  })

  it.each(contracts)('requires every $name field and rejects unknown payload fields', ({ fixture, decode }) => {
    const data: Record<string, unknown> = fixture()
    for (const key of Object.keys(data)) {
      const missing = { ...data }
      delete missing[key]
      expect(() => decode('id', missing), `missing ${key}`).toThrow()
    }
    for (const key of ['id', 'uid', 'extra']) {
      expect(() => decode('id', { ...data, [key]: 'untrusted' }), `extra ${key}`).toThrow()
    }
    for (const malformed of [null, undefined, [], 'text', 1]) {
      expect(() => decode('id', malformed)).toThrow()
    }
  })

  it('keeps colorIndex 0–5 aligned with the six project palette tokens', () => {
    const tokens = readFileSync('src/styles/tokens.css', 'utf8')
    const palette = [...tokens.matchAll(/--project-(\d+):/g)].map((match) => Number(match[1]))
    expect(palette).toEqual([0, 1, 2, 3, 4, 5])
    for (const colorIndex of palette) expect(decodeProject('p', { ...project(), colorIndex }).colorIndex).toBe(colorIndex)
    for (const colorIndex of [-1, 6, 0.5, NaN, Infinity, '1', null]) {
      expect(() => decodeProject('p', { ...project(), colorIndex })).toThrow()
    }
  })

  it('preserves multiline title text and rejects only titles without a non-whitespace character', () => {
    const title = ' \n\t First line\nSecond line \t'
    expect(decodeTask('t', { ...task(), title }).title).toBe(title)
    for (const title of ['', ' \n\t\r', '\u00a0\u2003\ufeff', null, 1]) {
      expect(() => decodeTask('t', { ...task(), title })).toThrow()
    }
    const longText = 'a'.repeat(50_000)
    expect(decodeTask('t', { ...task(), title: longText, description: longText }).title).toBe(longText)
  })

  it('uses the exact current UI enums, including the literal in-progress status', () => {
    for (const priority of ['none', 'low', 'medium', 'high']) {
      expect(decodeTask('t', { ...task(), priority }).priority).toBe(priority)
    }
    for (const status of ['todo', 'in-progress', 'done']) {
      expect(decodeTask('t', { ...task(), status }).status).toBe(status)
    }
    for (const priority of ['', 'urgent', null, 1]) expect(() => decodeTask('t', { ...task(), priority })).toThrow()
    for (const status of ['', 'in progress', null, 1]) expect(() => decodeTask('t', { ...task(), status })).toThrow()
  })

  it('validates every primitive field without inventing reference or cross-field constraints', () => {
    for (const key of ['projectId', 'description', 'category']) {
      for (const value of [null, 1, false]) expect(() => decodeTask('t', { ...task(), [key]: value })).toThrow()
    }
    for (const value of [null, 0, 'false']) expect(() => decodeTask('t', { ...task(), dueHasTime: value })).toThrow()
    expect(() => decodeProject('p', { ...project(), name: null })).toThrow()
    for (const key of ['type', 'text']) expect(() => decodeActivity('a', { ...activity(), [key]: null })).toThrow()
    for (const key of ['projectId', 'taskId']) {
      expect(decodeActivity('a', { ...activity(), [key]: '' })[key as 'projectId' | 'taskId']).toBe('')
      expect(() => decodeActivity('a', { ...activity(), [key]: 1 })).toThrow()
    }
    expect(decodeTask('t', {
      ...task(), projectId: '', status: 'done', dueDate: null, dueHasTime: true,
      createdAt: stamp(200), updatedAt: stamp(1), completedAt: null,
    })).toMatchObject({ projectId: '', completedAt: null, createdAt: 200_250, updatedAt: 1250 })
  })

  it('rejects malformed or pending non-null timestamps while retaining approved nullable slots', () => {
    const invalid = [
      null, 1000, new Date(), { toMillis: () => 1000 }, {}, stamp(NaN), stamp(Infinity),
      stamp(0.5), stamp(-62_135_596_801), stamp(253_402_300_800),
      stamp(1, -1), stamp(1, 1_000_000_000), stamp(1, 0.5),
      { seconds: '1', nanoseconds: 0 }, { seconds: 1, nanoseconds: '0' },
    ]
    for (const value of invalid) {
      expect(() => decodeProject('p', { ...project(), createdAt: value })).toThrow()
      expect(() => decodeProject('p', { ...project(), updatedAt: value })).toThrow()
      expect(() => decodeTask('t', { ...task(), createdAt: value })).toThrow()
      expect(() => decodeTask('t', { ...task(), updatedAt: value })).toThrow()
      expect(() => decodeActivity('a', { ...activity(), createdAt: value })).toThrow()
      if (value !== null) {
        expect(() => decodeTask('t', { ...task(), dueDate: value })).toThrow()
        expect(() => decodeTask('t', { ...task(), completedAt: value })).toThrow()
      }
    }
    expect(decodeTask('t', task())).toMatchObject({ dueDate: null, completedAt: null })
  })

  it('dispatches each stream and compares effective decoded data rather than timestamp instances', () => {
    const left = decodeDocument('projects', 'p', project())
    const right = decodeDocument('projects', 'p', project())
    expect(effectiveDataEqual(left, right)).toBe(true)
    expect(effectiveDataEqual(left, { ...right, updatedAt: right.updatedAt - 1 })).toBe(false)
    expect(decodeDocument('tasks', 't', task()).status).toBe('todo')
    expect(decodeDocument('activity', 'a', activity()).type).toBe('')
  })
})
