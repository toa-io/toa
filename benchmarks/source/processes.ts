import { execFileSync, spawn } from 'node:child_process'
import { cpSync, openSync, readFileSync } from 'node:fs'
import { mkdir, rm } from 'node:fs/promises'
import { join } from 'node:path'
import { setTimeout as sleep } from 'node:timers/promises'
import { cpu } from './counters.ts'
import { AUTHORITY, HOST } from './fixtures.ts'
import type { ChildProcess } from 'node:child_process'
import type { Placement } from './topology.ts'
import type { Tree } from './trees.ts'
import type { Protocol, ProcessName } from './scenarios.ts'

/** One revision's processes, and where they listen. */
export interface Side {
  name: 'base' | 'head'
  /** the vhost and the database, which is also the context */
  context: string
  tree: Tree
  ports: Ports
}

export interface Ports {
  gateway: number
  probe: number
  /** telemetry readiness of `bench`, `peer`, and the composition inside the gateway */
  ready: [number, number, number]
}

export interface Options {
  protocol: Protocol
  placement: Placement
  key: string
  /** where logs and temporary files go */
  directory: string
  /** whether each process opens an inspector, for its window to be profiled */
  inspect?: boolean
}

interface Launch {
  name: ProcessName
  args: string[]
  cpus: string | null
  environment: Record<string, string>
}

export class Process {
  public readonly name: ProcessName
  public readonly child: ChildProcess
  public readonly log: string
  public failure: string | null = null
  public killed = false

  private stopping = false
  private readonly exited: Promise<void>

  public constructor(name: ProcessName, child: ChildProcess, log: string) {
    this.name = name
    this.child = child
    this.log = log

    this.exited = new Promise((resolve) =>
      child.once('exit', (code, signal) => {
        if (!this.stopping) this.failure = `${name} exited with ${code ?? signal}; see ${log}`

        resolve()
      })
    )
  }

  /** Seconds of CPU, all threads. */
  public cpu(): number {
    return cpu(readFileSync(`/proc/${this.child.pid}/stat`, 'utf8'), TICKS)
  }

  /** Resident memory and its peak, in megabytes. */
  public memory(): { rss: number; peak: number } {
    const status = readFileSync(`/proc/${this.child.pid}/status`, 'utf8')

    return { rss: field(status, 'VmRSS'), peak: field(status, 'VmHWM') }
  }

  /** The IPC `ready` a composition sends once it is up. */
  public async ready(): Promise<void> {
    await new Promise<void>((resolve, reject) => {
      const timer = setTimeout(
        () => reject(new Error(`${this.name} not ready within ${READY / 1000} s; see ${this.log}`)),
        READY
      )

      this.child.on('message', (message) => {
        if (message !== 'ready') return

        clearTimeout(timer)
        resolve()
      })

      void this.exited.then(() => {
        clearTimeout(timer)
        reject(new Error(this.failure ?? `${this.name} exited`))
      })
    })
  }

  /** SIGTERM, then SIGKILL where a graceful shutdown does not finish; which it was is kept. */
  public async stop(): Promise<void> {
    if (this.child.exitCode !== null || this.child.signalCode !== null) return

    this.stopping = true
    this.child.kill('SIGTERM')

    const done = await Promise.race([this.exited.then(() => true), sleep(GRACE).then(() => false)])

    if (done) return

    this.killed = true
    this.child.kill('SIGKILL')
    await this.exited
  }
}

export class Running {
  public readonly side: Side
  public readonly protocol: Protocol
  public readonly processes: Record<ProcessName, Process>

  public constructor(side: Side, protocol: Protocol, processes: Record<ProcessName, Process>) {
    this.side = side
    this.protocol = protocol
    this.processes = processes
  }

  public get origin(): string {
    return `http://127.0.0.1:${this.side.ports.gateway}`
  }

  public cpu(): Record<ProcessName, number> {
    const { gateway, bench, peer } = this.processes

    return { gateway: gateway.cpu(), bench: bench.cpu(), peer: peer.cpu() }
  }

  public failure(): string | null {
    return Object.values(this.processes).find((process) => process.failure !== null)?.failure ?? null
  }

  /** Stops every process and answers the names of those that had to be killed. */
  public async stop(): Promise<string[]> {
    const all = Object.values(this.processes)

    await Promise.all(all.map(async (process) => await process.stop()))

    return all.filter((process) => process.killed).map((process) => process.name)
  }
}

/** The fixtures are copied into the tree under test, so they load that tree's runtime. */
export function install(tree: Tree, fixtures: string): string {
  const target = join(tree.root, '.bench')

  cpSync(fixtures, target, { recursive: true, force: true })

  return target
}

export async function boot(side: Side, components: string, options: Options): Promise<Running> {
  const temporary = join(options.directory, 'tmp', side.context)

  await mkdir(join(options.directory, 'logs'), { recursive: true })
  await rm(temporary, { recursive: true, force: true })
  await mkdir(temporary, { recursive: true })

  function start(launch: Launch): Process {
    return spawnProcess(side, options, {
      ...launch,
      environment: { ...environment(side, temporary), ...launch.environment }
    })
  }

  const peer = start({
    name: 'peer',
    args: ['compose', join(components, 'peer')],
    cpus: options.placement.components,
    environment: { TOA_TELEMETRY_READY: JSON.stringify({ port: side.ports.ready[1] }) }
  })

  const bench = start({
    name: 'bench',
    args: ['compose', join(components, 'bench')],
    cpus: options.placement.components,
    environment: { TOA_TELEMETRY_READY: JSON.stringify({ port: side.ports.ready[0] }) }
  })

  const started: Process[] = [peer, bench]

  try {
    await Promise.all([peer.ready(), bench.ready()])

    const gateway = start({
      name: 'gateway',
      args: ['serve', 'exposition'],
      cpus: options.placement.gateway,
      environment: {
        ...configuration(side, options),
        TOA_TELEMETRY_READY: JSON.stringify({ port: side.ports.ready[2] })
      }
    })

    started.push(gateway)
    await probe(side.ports.probe, gateway)

    return new Running(side, options.protocol, { gateway, bench, peer })
  } catch (error) {
    await Promise.all(started.map(async (process) => await process.stop()))

    throw error
  }
}

function spawnProcess(side: Side, options: Options, launch: Launch): Process {
  const log = join(options.directory, 'logs', `${side.context}.${options.protocol}.${launch.name}.log`)
  const output = openSync(log, 'a')
  const cli = join(side.tree.root, 'runtime/cli/bin/toa')

  // a port of the system's choosing, announced on stderr, so no inspector collides with anything
  const node = [...(options.inspect === true ? ['--inspect=127.0.0.1:0'] : []), cli, ...launch.args]
  const [command, argv] =
    launch.cpus === null ? [process.execPath, node] : ['taskset', ['-c', launch.cpus, process.execPath, ...node]]

  const child = spawn(command, argv, {
    cwd: side.tree.root,
    env: launch.environment,
    stdio: ['ignore', output, output, 'ipc']
  })

  return new Process(launch.name, child, log)
}

/**
 * What every process of a side shares. `TOA_DEV` points at the compose stack, and the defaults
 * it brings along — `trace` logs, a console span exporter — are replaced, since they would be
 * most of what is measured. `TOA_ENV` stays unset: `local` validates every reply.
 */
function environment(side: Side, temporary: string): Record<string, string> {
  const inherited = Object.fromEntries(
    Object.entries(process.env).filter(([name]) => !name.startsWith('TOA_') && name !== 'NODE_OPTIONS')
  ) as Record<string, string>

  return {
    ...inherited,
    TOA_DEV: '1',
    TOA_DEV_AMQP: `amqp://developer:secret@localhost:31010/${side.context}`,
    TOA_CONTEXT: side.context,
    TOA_TELEMETRY_LOGS: JSON.stringify({ level: 'warn' }),
    TOA_TELEMETRY_TRACES: JSON.stringify({}),
    TOA_STORAGES: JSON.stringify({ octets: { provider: 'tmp', directory: 'octets' } }),
    TMPDIR: temporary
  }
}

/** The gateway's identity configuration, without which its components wait for a values service. */
function configuration(side: Side, options: Options): Record<string, string> {
  const empty = ['BASIC', 'CLIENTS', 'GRANTS', 'FEDERATION', 'OTP', 'PASSKEYS']

  return {
    ...Object.fromEntries(empty.map((name) => [`TOA_CONFIGURATION_IDENTITY_${name}`, '{}'])),
    // a day, so the fresh token stays fresh for a run
    TOA_CONFIGURATION_IDENTITY_TOKENS: JSON.stringify({ keys: [{ id: 'key0', key: '$IDENTITY_TOKENS_KEY0' }], refresh: 86_400 }),
    TOA_CONFIGURATION__IDENTITY_TOKENS_KEY0: options.key,
    TOA_EXPOSITION_PROPERTIES: JSON.stringify({
      // the host a request names carries the port, and an authority is looked up by all of it:
      // a host missing from the map is an authority of its own, which no token is issued by
      authorities: { [AUTHORITY]: `${HOST}:${side.ports.gateway}` },
      port: side.ports.gateway,
      probe: side.ports.probe,
      protocol: options.protocol,
      mcp: { name: 'bench', anonymous: true }
    })
  }
}

/**
 * The gateway's own readiness. Its IPC `ready` also comes from the composition inside it, which
 * is ready before the routes are, so the probe is what is waited for.
 */
async function probe(port: number, gateway: Process): Promise<void> {
  const deadline = Date.now() + READY

  while (Date.now() < deadline) {
    if (gateway.failure !== null) throw new Error(gateway.failure)

    const status = await fetch(`http://127.0.0.1:${port}/.ready`)
      .then((response) => response.status)
      .catch(() => 0)

    if (status === 200) return

    await sleep(200)
  }

  throw new Error(`gateway not ready within ${READY / 1000} s; see ${gateway.log}`)
}

function field(status: string, name: string): number {
  return Number(new RegExp(`${name}:\\s+(\\d+)`).exec(status)?.[1] ?? 0) / 1024
}

const READY = 60_000
const GRACE = 15_000

/** what `/proc` counts CPU time in, per second */
export const TICKS = Number(execFileSync('getconf', ['CLK_TCK'], { encoding: 'utf8' }))
