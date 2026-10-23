import { beforeEach, describe, expect, it, vi } from 'vitest'
import { applySession, publishSessionData, useStore } from '../../src/store'
import { initialDataState, publishData } from '../../src/store/data-slice'
import { projectProgress, selectDataView } from '../../src/store/selectors'
import { confirmed, confirmedStreams, fixture } from './sync-test-helpers'

beforeEach(() => useStore.setState(initialDataState(null, fixture.now)))

describe('session-scoped read-only data', () => {
  it('starts empty and ignores documents published for an old UID', () => {
    expect(useStore.getState().rawTasks).toEqual([])
    applySession({ uid: 'new', displayName: null, photoURL: null })
    const state = useStore.getState()
    publishSessionData('old', { rawTasks: fixture.tasks })
    expect(useStore.getState()).toBe(state)
    applySession(null)
    expect(useStore.getState()).toMatchObject({ dataUid: null, rawProjects: [], rawTasks: [], activity: [] })
  })

  it('waits for both required streams and excludes orphan tasks from every derived view', () => {
    const orphan = { ...fixture.tasks[0], id: 'orphan', projectId: 'missing' }
    let state = publishData(initialDataState('user', fixture.now), {
      rawTasks: [...fixture.tasks, orphan], streams: { tasks: confirmed },
    }, fixture.now)
    expect(state).toMatchObject({ dataReady: false, tasks: [], orphanCount: 0 })
    state = publishData(state, { rawProjects: fixture.projects, streams: { projects: confirmed } }, fixture.now)
    expect(state.rawTasks).toHaveLength(4)
    expect(state.tasks).toEqual(fixture.tasks)
    expect(state.orphanCount).toBe(1)
    expect(state.stats.total).toBe(3)
    expect(Object.values(state.projectTasks).flat()).not.toContain(orphan)
    expect(Object.values(state.groups).flat()).not.toContain(orphan)
    expect(state.tasks[0]).toBe(fixture.tasks[0])
    expect(selectDataView(state)).toBe('ready')
  })

  it('keeps loaded rows during required-stream errors and makes activity errors nonblocking', () => {
    const state = publishData(initialDataState('user'), {
      rawProjects: fixture.projects, rawTasks: fixture.tasks, streams: confirmedStreams,
    }, fixture.now)
    const error = { kind: 'listener' as const, message: 'failed' }
    const activityError = publishData(state, { streams: { activity: { ...confirmed, error } } }, fixture.now)
    expect(selectDataView(activityError)).toBe('ready')
    expect(activityError.tasks).toBe(state.tasks)
    const requiredError = publishData(activityError, { streams: { tasks: { ...confirmed, error } } }, fixture.now)
    expect(selectDataView(requiredError)).toBe('error')
    expect(requiredError.tasks).toBe(state.tasks)
    expect(requiredError.dataReady).toBe(true)
    expect(selectDataView(publishData(requiredError, { streams: { tasks: confirmed } }, fixture.now))).toBe('ready')
  })

  it('uses the publication-time clock and preserves derived references for unchanged rows', () => {
    const state = publishData(initialDataState('user'), {
      rawProjects: fixture.projects, rawTasks: fixture.tasks, streams: confirmedStreams,
    }, fixture.now)
    const later = fixture.now + 1
    const next = publishData(state, { streams: { activity: { ...confirmed, fromCache: true } } }, later)
    expect(next.now).toBe(later)
    expect(next.tasks).toBe(state.tasks)
    expect(next.projects).toBe(state.projects)
    expect(next.projectTasks).toBe(state.projectTasks)
    expect(next.groups).toBe(state.groups)
    expect(next.stats).toBe(state.stats)
    expect(publishData(next, {}, later + 1)).toBe(next)
  })

  it('publishes once for real changes and treats duplicate metadata as a no-op', () => {
    useStore.setState(initialDataState('user'))
    const listener = vi.fn()
    const stop = useStore.subscribe(listener)
    publishSessionData('user', { streams: { projects: confirmed } }, 10)
    publishSessionData('user', { streams: { projects: { ...confirmed } } }, 20)
    expect(listener).toHaveBeenCalledTimes(1)
    expect(useStore.getState().now).toBe(10)
    stop()
  })

  it('distinguishes unconfirmed emptiness, confirmed first run, and a zero-task project', () => {
    const empty = initialDataState('user')
    expect(selectDataView(empty)).toBe('loading')
    const ready = publishData(empty, { streams: confirmedStreams }, fixture.now)
    expect(selectDataView(ready)).toBe('first-run')
    const project = publishData(ready, { rawProjects: fixture.projects.slice(0, 1) }, fixture.now)
    expect(selectDataView(project)).toBe('ready')
    expect(projectProgress(project.tasks)).toEqual({ completed: 0, total: 0, percent: 0 })
  })
})
