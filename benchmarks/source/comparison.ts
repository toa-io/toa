import { writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { setTimeout as sleep } from 'node:timers/promises'
import { perRequest } from './counters.ts'
import { Driver } from './driver.ts'
import { machine, measured, times } from './machine.ts'
import { boot, install, TICKS } from './processes.ts'
import { markdown } from './report.ts'
import { SIDES } from './run.ts'
import { estimate, median, verdict } from './statistics.ts'
import { STATISTICS } from './stack.ts'
import type { Counts } from './counters.ts'
import type { Load } from './driver.ts'
import type { LoadResult } from './load.ts'
import type { HostTimes } from './machine.ts'
import type { Running, Side } from './processes.ts'
import type { Report, ScenarioReport } from './report.ts'
import type { Pair, Run, SideName } from './run.ts'
import type { ProcessName, Protocol, Scenario } from './scenarios.ts'
import type { Tree } from './trees.ts'

export interface ComparisonOptions {
  scenarios: Scenario[]
  threshold: number
}

type Cpu = Record<ProcessName, number>

interface Measurement {
  /** µs of CPU per request, less what the process spends at rest */
  cpu: Cpu
  requests: number
  p50: number
  p99: number
  busy: number | null
}

interface Window extends Measurement {
  block: number
  scenario: string
  side: SideName
  index: number
}

/** What each side does at rest, per second. */
interface Idle {
  counts: Pair<Counts>
  cpu: Pair<Cpu>
}

/** The drivers of a boot, and what their processes spend at rest. */
interface Group {
  drivers: Pair<Driver>
  idle: Idle
}

/** CPU seconds of every process of both sides */
type Snapshot = Pair<Cpu>

/**
 * Both revisions, booted together once per block and protocol, taking turns under the same load:
 * A B B A in one block, B A A B in the next.
 */
export class Comparison {
  private readonly run: Run
  private readonly trees: Pair<Tree>
  private readonly scenarios: Scenario[]
  private readonly threshold: number
  private readonly sides: Pair<Side>
  private readonly components: Pair<string>
  private readonly windows: Window[] = []
  private readonly rates = new Map<string, number>()
  private readonly counts = new Map<string, Pair<Counts>>()
  private readonly memory = new Map<string, Pair<Record<string, number>>>()
  private readonly unsupported = new Map<string, string>()

  /** the drivers of the group being measured, whose processes a failed load is blamed on */
  private current: Pair<Driver> | null = null

  public constructor(run: Run, trees: Pair<Tree>, options: ComparisonOptions) {
    this.run = run
    this.trees = trees
    this.scenarios = options.scenarios
    this.threshold = options.threshold
    this.sides = { base: { ...SIDES.base, tree: trees.base }, head: { ...SIDES.head, tree: trees.head } }
    this.components = { base: install(trees.base, run.fixtures), head: install(trees.head, run.fixtures) }
  }

  /** Runs every block and answers the report as markdown. */
  public async execute(): Promise<string> {
    for (const side of [this.sides.base, this.sides.head]) await this.run.stack.drop(side.context)

    try {
      for (let block = 0; block < this.run.timing.blocks; block++)
        for (const protocol of PROTOCOLS) await this.block(block, protocol)
    } finally {
      await writeFile(join(this.run.results, 'windows.json'), JSON.stringify(this.windows, null, 2))
    }

    const report = this.report()
    const text = markdown(report)

    await writeFile(join(this.run.results, 'report.json'), JSON.stringify(report, null, 2))
    await writeFile(join(this.run.results, 'report.md'), text)

    return text
  }

  private async block(block: number, protocol: Protocol): Promise<void> {
    const group = this.scenarios.filter(
      (scenario) => scenario.protocol === protocol && !this.unsupported.has(scenario.id)
    )

    if (group.length === 0) return

    console.log(`Block ${block + 1} of ${this.run.timing.blocks}, ${protocol}`)

    for (const side of [this.sides.base, this.sides.head]) await this.run.stack.reset(side.context)

    const running = await this.boot(protocol)

    try {
      await this.group(block, group, running)
    } finally {
      for (const side of [running.base, running.head]) {
        const killed = await side.stop()

        if (killed.length > 0) console.warn(`  ${side.side.name}: killed after the grace period: ${killed.join(', ')}`)
      }
    }
  }

  private async boot(protocol: Protocol): Promise<Pair<Running>> {
    const options = { protocol, placement: this.run.placement, key: this.run.secret, directory: this.run.directory }
    const base = await boot(this.sides.base, this.components.base, options)

    try {
      return { base, head: await boot(this.sides.head, this.components.head, options) }
    } catch (error) {
      await base.stop()

      throw error
    }
  }

  private async group(block: number, scenarios: Scenario[], running: Pair<Running>): Promise<void> {
    const drivers: Pair<Driver> = {
      base: await Driver.prepare(this.run, running.base, true),
      head: await Driver.prepare(this.run, running.head, true)
    }

    this.current = drivers

    try {
      const supported = await this.supported(scenarios, drivers)
      const group = { drivers, idle: await this.idle(drivers) }

      if (block === 0) await this.calibrate(supported, group)

      for (const scenario of supported) await this.scenario(block, scenario, group)
    } finally {
      this.current = null
      drivers.base.close()
      drivers.head.close()
    }
  }

  /** The scenarios both sides answer correctly; a base that lacks what one requires skips it. */
  private async supported(group: Scenario[], drivers: Pair<Driver>): Promise<Scenario[]> {
    const supported: Scenario[] = []

    for (const scenario of group) {
      const refusal = await drivers.base.check(scenario)

      if (refusal !== null && scenario.requires !== undefined) {
        this.unsupported.set(scenario.id, `${refusal}, where the scenario requires ${scenario.requires}`)
        continue
      }

      if (refusal !== null) throw new Error(`${scenario.id} on base: ${refusal}`)

      const failure = await drivers.head.check(scenario)

      if (failure !== null) throw new Error(`${scenario.id} on head: ${failure}`)

      supported.push(scenario)
    }

    return supported
  }

  /** The rate of every scenario, and the counts of each side at that rate. */
  private async calibrate(scenarios: Scenario[], group: Group): Promise<void> {
    const { drivers, idle } = group

    for (const scenario of scenarios) {
      const rate = await drivers.base.calibrate(scenario)

      this.rates.set(scenario.id, rate)
      console.log(`  ${scenario.id}: ${rate} requests per second`)

      this.counts.set(scenario.id, {
        base: await this.count(drivers.base, scenario, idle.counts.base),
        head: await this.count(drivers.head, scenario, idle.counts.head)
      })
    }
  }

  /**
   * What both sides do while nothing is sent — outboxes polling, tenants announcing, timers — per
   * second, once the work of seeding has drained.
   */
  private async idle(drivers: Pair<Driver>): Promise<Idle> {
    await this.drain()
    await sleep(STATISTICS)

    const start = Date.now()
    const before = await this.snapshot(drivers)

    await sleep(IDLE * 1000 + STATISTICS)

    const seconds = (Date.now() - start) / 1000
    const after = await this.snapshot(drivers)

    return {
      counts: { base: rate(before.counts.base, after.counts.base, seconds), head: rate(before.counts.head, after.counts.head, seconds) },
      cpu: { base: perSecond(before.cpu.base, after.cpu.base, seconds), head: perSecond(before.cpu.head, after.cpu.head, seconds) }
    }
  }

  /** Until neither side has an event left to publish. */
  private async drain(): Promise<void> {
    const deadline = Date.now() + DRAIN * 1000

    for (;;) {
      const pending = (await this.run.stack.pending(this.sides.base.context)) + (await this.run.stack.pending(this.sides.head.context))

      if (pending === 0) return

      if (Date.now() > deadline) throw new Error(`${pending} events are still unpublished ${DRAIN} s after seeding`)

      await sleep(500)
    }
  }

  private async snapshot(drivers: Pair<Driver>): Promise<{ counts: Pair<Counts>; cpu: Snapshot }> {
    return {
      counts: { base: await this.counters('base'), head: await this.counters('head') },
      cpu: { base: drivers.base.running.cpu(), head: drivers.head.running.cpu() }
    }
  }

  private async counters(name: SideName): Promise<Counts> {
    const { context } = this.sides[name]

    return { publish: await this.run.stack.published(context), operations: await this.run.stack.operations(context) }
  }

  /** Messages and operations per request, around a short load, with the statistics settled. */
  private async count(driver: Driver, scenario: Scenario, background: Counts): Promise<Counts> {
    const name = driver.running.side.name
    const rate = this.rates.get(scenario.id)!

    await sleep(STATISTICS)

    const start = Date.now()
    const before = await this.counters(name)
    const result = await this.send(driver, scenario, { duration: this.duration(COUNTED, rate), rate })

    await sleep(STATISTICS)

    const after = await this.counters(name)

    return perRequest({ before, after, seconds: (Date.now() - start) / 1000, requests: result.requests, background })
  }

  private async scenario(block: number, scenario: Scenario, group: Group): Promise<void> {
    const order = block % 2 === 0 ? ABBA : BAAB

    for (const [index, name] of order.entries()) {
      const measurement = await this.window(scenario, name, group)

      this.windows.push({ block, scenario: scenario.id, side: name, index, ...measurement })
    }

    if (block === this.run.timing.blocks - 1)
      this.memory.set(scenario.id, { base: peaks(group.drivers.base.running), head: peaks(group.drivers.head.running) })
  }

  private async window(scenario: Scenario, name: SideName, group: Group): Promise<Measurement> {
    const { drivers, idle } = group
    const driver = drivers[name]
    const rate = this.rates.get(scenario.id)!
    const cores = measured(this.run.placement)

    await this.send(driver, scenario, { duration: this.run.timing.warmup, rate })

    const host = cores === null ? null : times(cores)
    const before = { base: drivers.base.running.cpu(), head: drivers.head.running.cpu() }
    const start = Date.now()
    const result = await this.send(driver, scenario, { duration: this.duration(this.run.timing.window, rate), rate })
    const seconds = (Date.now() - start) / 1000
    const after = { base: drivers.base.running.cpu(), head: drivers.head.running.cpu() }

    return {
      cpu: perRequestCpu({ before: before[name], after: after[name], idle: idle.cpu[name], seconds }, result.requests),
      requests: result.requests,
      p50: result.p50,
      p99: result.p99,
      busy: host === null ? null : busy(host, times(cores!), consumed(before, after))
    }
  }

  /** A window as long as asked, and long enough for its requests to outnumber what runs at rest. */
  private duration(seconds: number, rate: number): number {
    return Math.max(seconds, MINIMUM / rate)
  }

  /** Load that fails names the process that exited, on either side, where one did. */
  private async send(driver: Driver, scenario: Scenario, load: Load): Promise<LoadResult> {
    try {
      return await driver.load(scenario, load)
    } catch (error) {
      await sleep(EXIT)

      const failure = this.current === null ? null : (this.current.base.running.failure() ?? this.current.head.running.failure())
      const reason = failure ?? (error instanceof Error ? error.message : String(error))

      throw new Error(`${scenario.id} on ${driver.running.side.name}: ${reason}`, { cause: error })
    }
  }

  private report(): Report {
    return {
      base: { ref: this.trees.base.ref, sha: this.trees.base.sha },
      head: { ref: this.trees.head.ref, sha: this.trees.head.sha },
      machine: machine(this.run.placement),
      blocks: this.run.timing.blocks,
      threshold: this.threshold,
      scenarios: this.scenarios.map((scenario) => {
        const reason = this.unsupported.get(scenario.id)

        return reason === undefined ? this.aggregate(scenario) : { id: scenario.id, unsupported: reason }
      })
    }
  }

  private aggregate(scenario: Scenario): ScenarioReport {
    const own = this.windows.filter((window) => window.scenario === scenario.id)
    const pairs = pair(own)
    const busiest = own.map((window) => window.busy)

    return {
      id: scenario.id,
      rate: this.rates.get(scenario.id)!,
      processes: scenario.processes.map((name) => {
        const values = pairs.map(({ block, base, head }) => ({ block, base: base.cpu[name], head: head.cpu[name] }))
        const result = estimate(values)

        return {
          name,
          base: median(values.map(({ base }) => base)),
          head: median(values.map(({ head }) => head)),
          estimate: result,
          verdict: verdict(result, this.threshold)
        }
      }),
      counts: this.counts.get(scenario.id)!,
      latency: { base: latency(of(own, 'base')), head: latency(of(own, 'head')) },
      busy: busiest.includes(null) ? null : Math.max(...(busiest as number[])),
      memory: this.memory.get(scenario.id)
    }
  }
}

/** Windows next to each other in a block, one of each side. */
function pair(windows: Window[]): Array<Pair<Window> & { block: number }> {
  const pairs: Array<Pair<Window> & { block: number }> = []

  for (const block of new Set(windows.map((window) => window.block))) {
    const sequence = windows.filter((window) => window.block === block).sort((a, b) => a.index - b.index)

    for (let i = 0; i + 1 < sequence.length; i += 2) {
      const [first, second] = [sequence[i], sequence[i + 1]]

      pairs.push(first.side === 'base' ? { block, base: first, head: second } : { block, base: second, head: first })
    }
  }

  return pairs
}

function of(windows: Window[], side: SideName): Window[] {
  return windows.filter((window) => window.side === side)
}

function latency(windows: Window[]): { p50: number; p99: number } {
  return { p50: median(windows.map(({ p50 }) => p50)), p99: median(windows.map(({ p99 }) => p99)) }
}

function rate(before: Counts, after: Counts, seconds: number): Counts {
  return {
    publish: (after.publish - before.publish) / seconds,
    operations: (after.operations - before.operations) / seconds
  }
}

function perSecond(before: Cpu, after: Cpu, seconds: number): Cpu {
  return Object.fromEntries(PROCESSES.map((name) => [name, (after[name] - before[name]) / seconds])) as Cpu
}

function perRequestCpu(span: { before: Cpu; after: Cpu; idle: Cpu; seconds: number }, requests: number): Cpu {
  const { before, after, idle, seconds } = span

  return Object.fromEntries(
    PROCESSES.map((name) => [name, ((after[name] - before[name] - idle[name] * seconds) / requests) * 1e6])
  ) as Cpu
}

/** Seconds of CPU both sides' processes spent in a window. */
function consumed(before: Snapshot, after: Snapshot): number {
  return PROCESSES.reduce(
    (sum, name) => sum + after.base[name] - before.base[name] + after.head[name] - before.head[name],
    0
  )
}

/** The share of the measured cores that processes of neither side took. */
function busy(before: HostTimes, after: HostTimes, ours: number): number {
  const total = after.total - before.total

  return total === 0 ? 0 : Math.max(0, (after.busy - before.busy - ours * TICKS) / total)
}

function peaks(running: Running): Record<string, number> {
  return Object.fromEntries(PROCESSES.map((name) => [name, Math.round(running.processes[name].memory().peak)]))
}

const PROTOCOLS: Protocol[] = ['h1', 'h2c']
const PROCESSES: ProcessName[] = ['gateway', 'bench', 'peer']
const ABBA: SideName[] = ['base', 'head', 'head', 'base']
const BAAB: SideName[] = ['head', 'base', 'base', 'head']

/** seconds of the quiet window what runs at rest is measured in, and of counted load */
const IDLE = 20
const COUNTED = 3

/** requests a window holds at least, whatever the rate */
const MINIMUM = 1000

/** seconds the events of seeding may take to be published */
const DRAIN = 120

/** how long an exit may take to be seen after the load it broke */
const EXIT = 500
