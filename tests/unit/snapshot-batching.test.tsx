import { memo, Profiler } from 'react'
import { act, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createFrameBatch } from '../../src/lib/subscriptions/frame-batch'
import { publishSessionData, useStore } from '../../src/store'
import { initialDataState } from '../../src/store/data-slice'
import { confirmed, confirmedStreams, controlledFrames, fixture } from './sync-test-helpers'

beforeEach(() => {
  useStore.setState(initialDataState('user', fixture.now))
  publishSessionData('user', { rawProjects: fixture.projects, rawTasks: fixture.tasks, streams: confirmedStreams }, fixture.now)
})

function batching() {
  const frames = controlledFrames()
  const publish = vi.fn((publication: Parameters<typeof publishSessionData>[1]) => publishSessionData('user', publication, fixture.now))
  const batch = createFrameBatch({ current: () => {
    const state = useStore.getState()
    return { projects: state.rawProjects, tasks: state.rawTasks, activity: state.activity }
  }, publish, requestFrame: frames.request, cancelFrame: frames.cancel })
  return { frames, publish, batch }
}

describe('frame-coalesced snapshots', () => {
  it('publishes 100 callbacks once and commits affected subscribers once while keeping unaffected rows stable', () => {
    const changed = vi.fn()
    const unchanged = vi.fn()
    const Row = memo(function Row({ index }: { index: number }) {
      const task = useStore((state) => state.tasks[index])
      return <span>{task.title}</span>
    })
    render(<><Profiler id="changed" onRender={changed}><Row index={0} /></Profiler>
      <Profiler id="unchanged" onRender={unchanged}><Row index={1} /></Profiler></>)
    changed.mockClear()
    unchanged.mockClear()
    const publication = vi.fn()
    const stop = useStore.subscribe(publication)
    const { frames, publish, batch } = batching()
    for (let index = 0; index < 100; index++) batch.enqueue('tasks', [{
      type: 'modified', id: fixture.tasks[0].id, data: { ...fixture.tasks[0], title: `Change ${index}` },
    }], confirmed)
    expect(batch.pendingSize()).toBe(1)
    expect(frames.size()).toBe(1)
    expect(publication).not.toHaveBeenCalled()
    act(() => frames.flush())
    expect(screen.getByText('Change 99')).toBeInTheDocument()
    expect(publish).toHaveBeenCalledTimes(1)
    expect(publication).toHaveBeenCalledTimes(1)
    expect(changed).toHaveBeenCalledTimes(1)
    expect(unchanged).not.toHaveBeenCalled()
    expect(useStore.getState().tasks[1]).toBe(fixture.tasks[1])
    stop()
    batch.stop()
  })

  it('bounds hidden-tab state by effective IDs and collapses transient add/remove pairs', () => {
    const { frames, publish, batch } = batching()
    for (let index = 0; index < 1000; index++) {
      batch.enqueue('tasks', [{ type: 'modified', id: fixture.tasks[0].id,
        data: { ...fixture.tasks[0], title: `Final ${index}` } }], confirmed)
      const temporary = { ...fixture.tasks[0], id: `temporary-${index}` }
      batch.enqueue('tasks', [{ type: 'added', id: temporary.id, data: temporary }], confirmed)
      batch.enqueue('tasks', [{ type: 'removed', id: temporary.id }], confirmed)
      expect(batch.pendingSize()).toBe(1)
    }
    expect(frames.size()).toBe(1)
    expect(publish).not.toHaveBeenCalled()
    frames.flush()
    expect(publish).toHaveBeenCalledTimes(1)
    expect(useStore.getState().tasks).toHaveLength(3)
    expect(useStore.getState().tasks[0].title).toBe('Final 999')
    expect(batch.pendingSize()).toBe(0)
    batch.stop()
  })

  it('retains the current limited activity window without accumulating historical windows', () => {
    const { batch, frames } = batching()
    let ids: string[] = []
    for (let index = 0; index < 200; index++) {
      const id = `event-${index}`
      const removed = ids.length === 20 ? ids.at(-1) : undefined
      ids = [id, ...ids].slice(0, 20)
      batch.enqueue('activity', [
        ...(removed ? [{ type: 'removed' as const, id: removed }] : []),
        { type: 'added', id, data: { id, type: '', taskId: null, projectId: null, text: '', createdAt: index } },
      ], confirmed, ids)
      expect(batch.pendingSize()).toBeLessThanOrEqual(20)
    }
    frames.flush()
    expect(useStore.getState().activity.map((row) => row.id)).toEqual(ids)
    expect(useStore.getState().activity).toHaveLength(20)
    batch.stop()
  })

  it('clears queued documents and cancels pending work on stop even without a frame', () => {
    const { batch, frames, publish } = batching()
    batch.enqueue('tasks', [{ type: 'removed', id: fixture.tasks[0].id }], confirmed)
    expect(batch.pendingSize()).toBe(1)
    batch.stop()
    expect(batch.pendingSize()).toBe(0)
    expect(frames.size()).toBe(0)
    frames.flush()
    batch.enqueue('tasks', [], confirmed)
    expect(publish).not.toHaveBeenCalled()
    expect(frames.size()).toBe(0)
  })
})
