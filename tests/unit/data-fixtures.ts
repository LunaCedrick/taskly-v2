import { makeFakeData, FIXTURE_NOW } from '../../src/lib/fake-data'
import { applySession, publishSessionData, useStore } from '../../src/store'
import type { StreamState } from '../../src/store/data-slice'

export const confirmedStream: StreamState = { ready: true, fromCache: false, error: null, registered: true }

export function seedStore(count = 1000, now = FIXTURE_NOW, uid = 'unit-owner') {
  const data = makeFakeData(count, now)
  applySession({ uid, displayName: 'Test Owner', photoURL: null })
  publishSessionData(uid, { rawProjects: data.projects, rawTasks: data.tasks, activity: [],
    streams: { projects: confirmedStream, tasks: confirmedStream, activity: confirmedStream } }, now)
  return useStore.getState()
}
