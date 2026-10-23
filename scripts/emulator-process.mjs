import { spawn, spawnSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import { createServer } from 'node:net'
import { delimiter, dirname, join, resolve } from 'node:path'
import { EMULATOR_HOST } from '../src/lib/firebase/emulator-config.ts'

export function requireJava21(output) {
  const match = output.match(/(?:openjdk|java) version "(\d+)(?:\.(\d+))?/i)
  const major = match ? Number(match[1] === '1' ? match[2] : match[1]) : 0
  if (major < 21) throw new Error(`Java 21 or newer is required; detected ${major || 'unknown version'}`)
  return major
}

export function javaVersion(environment) {
  const result = spawnSync('java', ['-version'], {
    encoding: 'utf8', windowsHide: true, env: environment, timeout: 10_000,
  })
  if (result.error || result.status !== 0) {
    throw new Error(`Java 21 or newer is required: ${result.error?.message ?? result.stderr}`)
  }
  const version = `${result.stdout}${result.stderr}`.trim()
  return { version, major: requireJava21(version) }
}

export function findFirebaseCli(root) {
  const candidates = [join(root, 'node_modules/firebase-tools/lib/bin/firebase.js'),
    ...(process.env.PATH ?? '').split(delimiter).flatMap((directory) => [
      join(directory, 'node_modules/firebase-tools/lib/bin/firebase.js'),
      resolve(directory, '../lib/node_modules/firebase-tools/lib/bin/firebase.js'),
    ])]
  const cli = candidates.find((candidate) => existsSync(candidate))
  if (!cli) throw new Error('Installed Firebase CLI required; no package will be installed automatically')
  return cli
}

export function installedFirebaseCliVersion(cli) {
  const manifestPath = resolve(dirname(cli), '../..', 'package.json')
  let manifest
  try {
    manifest = JSON.parse(readFileSync(manifestPath, 'utf8'))
  } catch (error) {
    throw new Error(`Cannot read installed Firebase CLI manifest: ${error.message}`)
  }
  if (manifest.name !== 'firebase-tools' || typeof manifest.version !== 'string'
    || !/^\d+\.\d+\.\d+(?:-[\w.-]+)?(?:\+[\w.-]+)?$/.test(manifest.version)) {
    throw new Error('Installed Firebase CLI manifest must identify firebase-tools with a valid version')
  }
  return manifest.version
}

export async function assertFreePort(port) {
  const server = createServer()
  await new Promise((ready, reject) => {
    server.once('error', () => reject(new Error(`Port ${port} is occupied; no existing service will be reused or stopped`)))
    server.listen(port, EMULATOR_HOST, ready)
  })
  await new Promise((done) => server.close(done))
}

export async function auxiliaryPort() {
  const server = createServer()
  await new Promise((ready, reject) => {
    server.once('error', reject)
    server.listen(0, EMULATOR_HOST, ready)
  })
  const port = server.address().port
  await new Promise((done) => server.close(done))
  return port
}

export function createProcessOwner(root, environment) {
  const children = new Set()
  const results = new WeakMap()
  function start(script, args, options = {}) {
    const { nodeArgs = [], ...spawnOptions } = options
    const child = spawn(process.execPath, [...nodeArgs, script, ...args], {
      cwd: root, env: environment, windowsHide: true,
      detached: process.platform !== 'win32', stdio: 'inherit', ...spawnOptions,
    })
    children.add(child)
    const result = new Promise((done, reject) => {
      child.once('error', (error) => { child.startError = error; reject(error) })
      child.once('close', (code, signal) => code === 0 ? done()
        : reject(new Error(`Process exited ${code} (signal ${signal})`)))
    })
    result.catch(() => {}) // Startup probes also observe early exits before a caller awaits completion.
    results.set(child, result)
    return child
  }
  async function stop(child) {
    if (!child.pid || child.exitCode !== null || child.signalCode !== null) return
    if (process.platform === 'win32') {
      const killer = spawn('taskkill', ['/pid', String(child.pid), '/t', '/f'], {
        windowsHide: true, stdio: 'ignore',
      })
      await new Promise((done) => { killer.once('error', done); killer.once('close', done) })
    } else {
      try { process.kill(-child.pid, 'SIGTERM') } catch { child.kill('SIGTERM') }
      let timer
      await Promise.race([results.get(child).catch(() => {}), new Promise((done) => {
        timer = setTimeout(() => {
          try { process.kill(-child.pid, 'SIGKILL') } catch { /* The owned process group already exited. */ }
          done()
        }, 2000)
      })])
      clearTimeout(timer)
    }
  }
  let stopped
  return {
    start,
    completed: (child) => results.get(child),
    run: (script, args, options) => results.get(start(script, args, options)),
    stop: () => (stopped ??= (async () => {
      for (const child of [...children].reverse()) await stop(child)
    })()),
  }
}
