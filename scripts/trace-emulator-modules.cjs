// Optional process-local CLI diagnostic. Never log arguments, environment values, or exports.
const fs = require('node:fs')
const Module = require('node:module')
const path = require('node:path')

const anchor = Number(process.env.TASKLY_TRACE_SPAWNED_AT_MS)
const target = process.env.TASKLY_TRACE_MODULES_PATH
if (!target || !Number.isFinite(anchor) || anchor <= 0) {
  throw new Error('CLI module tracing requires an owned target and parent-spawn timestamp')
}
const descriptor = fs.openSync(target, 'a')
const cliRoot = (process.env.TASKLY_TRACE_CLI_ROOT ?? '').replaceAll('\\', '/')
const original = Module._load
let sequence = 0
let depth = 0

function moduleName(value) {
  if (typeof value !== 'string' || !/^[\w@./:\\-]+$/.test(value)) return '<nonstandard-module>'
  const normalized = value.replaceAll('\\', '/')
  if (cliRoot && normalized.startsWith(`${cliRoot}/`)) {
    return `<firebase-tools>/${normalized.slice(cliRoot.length + 1)}`
  }
  if (path.isAbsolute(value)) return `<external>/${path.basename(value)}`
  return normalized
}

function record(entry) {
  fs.writeSync(descriptor, JSON.stringify(entry) + '\n')
}

record({ phase: 'anchor', module: '<parent-spawn>', spawnedAtMs: anchor, elapsedMs: Date.now() - anchor })
Module._load = function tracedLoad(request, parent, isMain) {
  const id = ++sequence
  const start = process.hrtime.bigint()
  const identity = { id, depth, module: moduleName(request), parent: moduleName(parent?.filename) }
  record({ ...identity, phase: 'enter', elapsedMs: Date.now() - anchor })
  depth++
  let completed = false
  try {
    const value = Reflect.apply(original, this, [request, parent, isMain])
    completed = true
    return value
  } finally {
    depth--
    record({ ...identity, phase: 'exit', elapsedMs: Date.now() - anchor,
      durationMs: Number(process.hrtime.bigint() - start) / 1_000_000, completed })
  }
}
process.once('exit', () => {
  Module._load = original
  fs.closeSync(descriptor)
})
