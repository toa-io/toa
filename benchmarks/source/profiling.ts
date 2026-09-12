import { mkdir, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { Driver } from './driver.ts'
import { Profiler } from './inspector.ts'
import { boot, install } from './processes.ts'
import { summarize } from './profile.ts'
import { SLOTS } from './slots.ts'
import type { Running, Side } from './processes.ts'
import type { Run } from './run.ts'
import type { ProcessName, Scenario } from './scenarios.ts'
import type { Tree } from './trees.ts'

interface Target {
  side: Side
  components: string
}

interface Recording {
  name: ProcessName
  directory: string
  root: string
  requests: number
}

/** Profiles of one revision, every process under every scenario; answers the summary's path. */
export async function profile(run: Run, tree: Tree, scenarios: Scenario[]): Promise<string> {
  const target: Target = { side: { ...SLOTS.a, name: 'head', tree }, components: install(tree, run.fixtures) }
  const summary = [`# Profiles of ${tree.ref} (${tree.sha.slice(0, 7)})`, '']

  await run.stack.drop(target.side.context)

  for (const scenario of scenarios) summary.push(...(await one(run, target, scenario)))

  const file = join(run.results, 'profiles.md')

  await writeFile(file, summary.join('\n'))

  return file
}

async function one(run: Run, target: Target, scenario: Scenario): Promise<string[]> {
  console.log(scenario.id)

  await run.stack.reset(target.side.context)

  const running = await boot(target.side, target.components, {
    protocol: scenario.protocol,
    placement: run.placement,
    key: run.secret,
    directory: run.directory,
    inspect: true
  })

  try {
    return await record(run, running, scenario)
  } finally {
    const killed = await running.stop()

    if (killed.length > 0) console.warn(`  killed after the grace period: ${killed.join(', ')}`)
  }
}

async function record(run: Run, running: Running, scenario: Scenario): Promise<string[]> {
  const driver = await Driver.prepare(run, running, scenario.seeded === true)
  const profilers: Array<[ProcessName, Profiler]> = []

  try {
    const refusal = await driver.check(scenario)

    if (refusal !== null) throw new Error(`${scenario.id}: ${refusal}`)

    const rate = await driver.calibrate(scenario)

    await driver.load(scenario, { duration: run.timing.warmup, rate })

    for (const name of PROCESSES) profilers.push([name, await Profiler.attach(running.processes[name].log)])
    for (const [, profiler] of profilers) await profiler.start()

    const result = await driver.load(scenario, { duration: run.timing.window, rate })
    const directory = join(run.results, 'profiles', scenario.id)
    const lines = [`## ${scenario.id}`, '', `${result.requests} requests at ${rate} per second`, '']

    await mkdir(directory, { recursive: true })

    for (const [name, profiler] of profilers)
      lines.push(...(await write(profiler, { name, directory, root: running.side.tree.root, requests: result.requests })))

    return lines
  } finally {
    for (const [, profiler] of profilers) profiler.close()

    driver.close()
  }
}

async function write(profiler: Profiler, recording: Recording): Promise<string[]> {
  const recorded = await profiler.stop()
  const { total, functions, packages } = summarize(recorded, { root: recording.root })

  await writeFile(join(recording.directory, `${recording.name}.cpuprofile`), JSON.stringify(recorded))

  return [
    `### ${recording.name}: ${((total * 1000) / recording.requests).toFixed(0)} µs per request`,
    '',
    '| package | share |',
    '| --- | ---: |',
    ...packages.slice(0, 10).map(({ name, share }) => `| ${name} | ${(share * 100).toFixed(1)}% |`),
    '',
    '| function | share |',
    '| --- | ---: |',
    ...functions.map(({ name, share }) => `| \`${name}\` | ${(share * 100).toFixed(1)}% |`),
    ''
  ]
}

const PROCESSES: ProcessName[] = ['gateway', 'bench', 'peer']
