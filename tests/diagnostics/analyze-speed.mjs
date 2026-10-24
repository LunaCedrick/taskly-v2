import { readFile, readdir, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { gunzipSync } from 'node:zlib'

export const quantile = (values, percentile) => [...values].sort((a, b) => a - b)[Math.ceil(values.length * percentile) - 1]
function decorate(run) {
  const visits = new Map([['/', 1]])
  return run.transitions.map((sample, index) => {
    const visit = (visits.get(sample.to) ?? 0) + 1
    visits.set(sample.to, visit)
    return { ...sample, sequence: index + 1, destinationVisit: visit }
  })
}
export function summarize(runs) {
  const samples = runs.flatMap(decorate)
  const slow = samples.filter((sample) => sample.milliseconds > 100)
  const routePairs = {}
  for (const sample of samples) {
    const pair = `${sample.from} -> ${sample.to}`
    const counts = routePairs[pair] ??= { total: 0, over100: 0 }
    counts.total++
    if (sample.milliseconds > 100) counts.over100++
  }
  return { runs: runs.length, samples: samples.length, over100: slow.length,
    shareOver100: slow.length / samples.length, pooledP95: quantile(samples.map((s) => s.milliseconds), .95),
    pooledP99: quantile(samples.map((s) => s.milliseconds), .99), routePairs, slowRepeatTasksProject: slow.filter((s) =>
      s.from === '/tasks' && s.to === '/projects/project-1' && s.destinationVisit > 1).length }
}
export function unionMs(ranges) {
  const sorted = ranges.sort((a, b) => a[0] - b[0])
  let total = 0, start = 0, end = 0
  for (const [a, b] of sorted) {
    if (a > end) { total += end - start; start = a; end = b } else end = Math.max(end, b)
  }
  return (total + end - start) / 1000
}
export function partitionMs(groups, start, end) {
  const points = [start, end]
  for (const ranges of Object.values(groups)) for (const [a, b] of ranges) points.push(a, b)
  const sorted = [...new Set(points)].sort((a, b) => a - b)
  const result = { gc: 0, rendering: 0, scripting: 0, unclassified: 0 }
  for (let i = 1; i < sorted.length; i++) {
    const a = sorted[i - 1], b = sorted[i]
    const group = ['gc', 'rendering', 'scripting'].find((key) => groups[key].some(([x, y]) => x <= a && y >= b))
    result[group ?? 'unclassified'] += (b - a) / 1000
  }
  return result
}
function durationEvents(events) {
  const stacks = new Map()
  const intervals = []
  for (const event of events) {
    const key = `${event.pid}:${event.tid}`
    if (event.ph === 'X' && event.dur) intervals.push(event)
    if (event.ph === 'B') {
      const stack = stacks.get(key) ?? []
      stack.push(event); stacks.set(key, stack)
    }
    if (event.ph === 'E') {
      const begin = stacks.get(key)?.pop()
      if (begin) intervals.push({ ...begin, dur: event.ts - begin.ts })
    }
  }
  return intervals
}
async function analyze(directory) {
  if (!process.argv.includes('--profile-only')) {
  const summary = {}
  const runs = []
  for (const name of (await readdir(directory)).filter((name) => /^[ABC]\d+$/.test(name))) {
    const data = JSON.parse(await readFile(resolve(directory, name, 'samples.json'), 'utf8'))
    runs.push({ label: name, median: data.median, p95: data.p95, max: data.max,
      over100: decorate(data).filter((s) => s.milliseconds > 100), counts: summarize([data]) })
  }
  for (const side of ['A', 'B', 'C']) {
    const source = []
    for (const run of runs.filter((r) => r.label.startsWith(side))) {
      source.push(JSON.parse(await readFile(resolve(directory, run.label, 'samples.json'), 'utf8')))
    }
    summary[side] = summarize(source)
  }
  await writeFile(resolve(directory, 'summary.json'), JSON.stringify({ diagnostic: true, summary, runs }) + '\n')
  console.log(JSON.stringify(summary, null, 2))
  }
  const { windows, longTasks } = JSON.parse(await readFile(resolve(directory, 'profile/windows.json'), 'utf8'))
  const { traceEvents } = JSON.parse(gunzipSync(await readFile(resolve(directory, 'profile/timeline.json.gz'))))
  const durations = durationEvents(traceEvents)
  const timing = windows.map((window) => {
    const start = traceEvents.find((event) => event.name === `taskly-start-${window.sequence}`)
    const end = traceEvents.find((event) => event.name === `taskly-end-${window.sequence}`)
    if (!start || !end) throw new Error('Missing profile clock marker')
    const events = durations.filter((e) => e.pid === start.pid && e.tid === start.tid && e.dur
      && e.ts < end.ts && e.ts + e.dur > start.ts)
    const ranges = (regex) => events.filter((e) => regex.test(e.name))
      .map((e) => [Math.max(e.ts, start.ts), Math.min(e.ts + e.dur, end.ts)])
    const groups = { scripting: ranges(/FunctionCall|EvaluateScript|RunMicrotasks|EventDispatch|TimerFire/),
      rendering: ranges(/Layout|UpdateLayoutTree|PrePaint|Paint|CompositeLayers/), gc: ranges(/GC|Scavenge/) }
    return { ...window, scriptingMs: unionMs(groups.scripting),
      renderingMs: unionMs(groups.rendering), gcMs: unionMs(groups.gc),
      mainThreadExclusiveMs: partitionMs(groups, start.ts, end.ts),
      longTasks: longTasks.filter((task) => task.start < window.ended && task.start + task.duration > window.started) }
  })
  await writeFile(resolve(directory, 'profile/summary.json'), JSON.stringify({ traceEvents: traceEvents.length,
    categoriesOverlap: true, windows: timing,
    slowRepeatTasksProject: timing.filter((w) => w.repeat && w.to === '/projects/project-1' && w.duration > 100) }) + '\n')
  console.log(JSON.stringify({ profiledTransitions: timing.length,
    slowRepeatProject: timing.filter((w) => w.repeat && w.to === '/projects/project-1' && w.duration > 100).length }))
}
if (process.argv[1]?.replaceAll('\\', '/').endsWith('/analyze-speed.mjs')) await analyze(resolve(process.argv[2]))
