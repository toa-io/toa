import assert from 'node:assert'
import { type ChildProcess, execFileSync, fork } from 'node:child_process'
import { resolve } from 'node:path'
import { setTimeout as delay } from 'node:timers/promises'
import { after, binding, given, then, when } from 'specumber'
import { environment } from '@toa.io/generic'

import * as boot from '@toa.io/boot'
import { Locator } from '@toa.io/core'
import { find } from '../../source/Composition.ts'
import type { Component } from '@toa.io/core'

/**
 * A halt is a thing a deployment does, so this runs one: a process per member, forked, each
 * a `Workload` the way `toa compose` is. One of them holds the introspection components —
 * the explorer, and the map every process reads to find out whether the deployment went
 * quiet — and the rest hold application components.
 *
 * What each process holds open is read off the operating system rather than reported by the
 * process, because what a halt is for is that nothing is connected.
 */
@binding()
export class Halt {
  private readonly fleet: Member[] = []
  private signals: Component | null = null

  @given('a running deployment')
  public async quiet(): Promise<void> {
    await this.run(explorer(), [component('probe.source'), component('probe.target')])
  }

  @given('a running deployment with a component that keeps its own time')
  public async busy(): Promise<void> {
    // `probe.source` because `probe.target` receives its event, and a receiver looks its
    // source up before the process is up
    await this.run(explorer(), [
      fleet('probe.busy'),
      component('probe.source'),
      component('probe.target')
    ])
  }

  @when('a halt of {int} seconds is signalled')
  public async signal(seconds: number): Promise<void> {
    this.signals ??= await boot.remote(new Locator('signals', 'introspection'))

    await this.signals.connect()

    const reply = await this.signals.invoke('create', {
      input: { type: 'halt', seconds, quiescence: QUIESCENCE, grace: GRACE }
    })

    assert.equal(reply.error, undefined, `Signal refused: ${JSON.stringify(reply)}`)

    // its own connection is not a process's, and would be counted as one
    await this.signals.disconnect()

    this.signals = null
  }

  /** The first member of every deployment here is the one holding the map. */
  /** What the annotation says, read where whoever writes a halt reads it. */
  @then('a halt may ask to stay down for {int} to {int} seconds, and to go quiet for {int} to {int}')
  public async bounds(
    duration: number,
    until: number,
    quiescence: number,
    quiet: number
  ): Promise<void> {
    this.signals ??= await boot.remote(new Locator('signals', 'introspection'))

    await this.signals.connect()

    const reply = await this.signals.invoke('configuration', {})

    await this.signals.disconnect()

    this.signals = null

    assert.deepEqual(reply.output ?? reply, {
      halt: { duration: [duration, until], quiescence: [quiescence, quiet] }
    })
  }

  @when('the explorer is killed')
  public async kill(): Promise<void> {
    const explorer = this.fleet[0]

    explorer.killed = true
    explorer.child.kill('SIGKILL')
  }

  @then('every process holds no connection')
  public async none(): Promise<void> {
    for (const member of this.live())
      await eventually(
        () => held(member.child.pid!) === 0,
        `a process still holds connections (${held(member.child.pid!)})`
      )
  }

  @then('every process holds connections again')
  public async again(): Promise<void> {
    for (const member of this.live())
      await eventually(
        () => held(member.child.pid!) > 0,
        () => `a process holds no connection: ${describe(member)}`,
        RESUME
      )
  }

  @then('every process goes quiet')
  public async gone(): Promise<void> {
    for (const member of this.live())
      await eventually(() => member.state.quiescent, 'a process never went quiet')
  }

  /**
   * The halt was called off, so what is asserted is a double negative: every process works
   * again, and none of them closed anything on the way — which is the whole difference
   * between a halt that was cancelled and one that was carried out.
   */
  @then('every process works again, holding what it held')
  public async restored(): Promise<void> {
    for (const member of this.live()) {
      const pid = member.child.pid!

      await eventually(
        () => {
          assert.ok(held(pid) > 0, 'a process let go of what it held')

          return !member.state.quiescent
        },
        'a process never started working again',
        CANCEL
      )

      assert.ok(member.state.running, 'a process is not running')
    }
  }

  @after('@halt')
  public async shutdown(): Promise<void> {
    await this.signals?.disconnect()

    this.signals = null

    for (const member of this.fleet) {
      if (member.dead) continue

      member.child.send('stop')
    }

    await Promise.all(this.fleet.map(async (member) => await ended(member)))

    this.fleet.length = 0
  }

  private async run(...processes: string[][]): Promise<void> {
    for (const paths of processes) this.fleet.push(await member(paths))
  }

  /**
   * The members a scenario is about, and an assertion on the way: a process that exited is a
   * failed halt rather than one less thing to check — a halted process holds nothing, so what
   * keeps it alive is the runtime's to hold.
   */
  private live(): Member[] {
    const live = this.fleet.filter((member) => !member.killed)

    for (const member of live) assert.ok(!member.dead, 'a process exited')

    return live
  }
}

async function member(paths: string[]): Promise<Member> {
  const child = fork(MEMBER, [JSON.stringify(paths)], {
    env: environment.entries(),
    // what a member says of itself comes over the channel; what it logs is the run's, so
    // that a scenario that fails is one somebody can read afterwards
    stdio: ['ignore', 'inherit', 'inherit', 'ipc']
  })

  const state: State = { running: false, quiescent: false, at: 0 }
  const instance: Member = { child, state, dead: false, killed: false }

  child.on('exit', () => {
    instance.dead = true
  })

  await new Promise<void>((resolve, reject) => {
    // cleared once it is up: a deadline left running would kill the process it waited for
    const deadline = globalThis.setTimeout(() => {
      child.kill('SIGKILL')
      reject(new Error('a process did not come up'))
    }, BOOT)

    child.on('message', (message: Report | string) => {
      // the readiness probe of a process says `ready` over the same channel
      if (typeof message !== 'object') return

      if ('up' in message) {
        clearTimeout(deadline)
        resolve()
      } else Object.assign(state, message)
    })

    child.on('error', (error) => {
      clearTimeout(deadline)
      reject(error)
    })
  })

  return instance
}

async function ended(member: Member): Promise<void> {
  if (member.dead) return

  await new Promise<void>((resolve) => {
    const deadline = globalThis.setTimeout(() => {
      member.child.kill('SIGKILL')
      resolve()
    }, SHUTDOWN)

    member.child.on('exit', () => {
      clearTimeout(deadline)
      resolve()
    })
  })
}

/** Every socket a process holds to the database, the broker and the cache. */
function held(pid: number): number {
  const out = execFileSync('ss', ['-tnp'], { encoding: 'utf8' })

  return out
    .split('\n')
    .filter((line) => line.includes(`pid=${pid},`))
    .filter((line) => PORTS.some((port) => line.includes(`:${port} `))).length
}

async function eventually(
  condition: () => boolean,
  failure: string | (() => string),
  limit = DEADLINE
): Promise<void> {
  const deadline = Date.now() + limit

  while (Date.now() < deadline) {
    if (condition()) return

    await delay(POLL)
  }

  assert.fail(typeof failure === 'function' ? failure() : failure)
}

/** What a member was doing when it last said, for a failure to name. */
function describe(member: Member): string {
  if (member.dead) return 'it exited'

  const age = Date.now() - member.state.at

  return `running: ${member.state.running}, quiet: ${member.state.quiescent}, said ${age}ms ago`
}

function component(name: string): string {
  return resolve(import.meta.dirname, 'components', name)
}

/*
 * Apart from the rest, because everything under `components` is booted by every other
 * scenario of this suite, and a component that calls twice a second would be on the map
 * they read.
 */
function fleet(name: string): string {
  return resolve(import.meta.dirname, 'fleet', name)
}

interface Member {
  child: ChildProcess
  state: State
  /** it has exited, whoever ended it */
  dead: boolean
  /** a scenario killed it on purpose */
  killed: boolean
}

interface State {
  running: boolean
  quiescent: boolean
  /** when the process last said so */
  at: number
}

type Report = State | { up: true }

const MEMBER = resolve(import.meta.dirname, 'fleet', 'member.js')

/**
 * The explorer, as a deployment runs it: the components this extension ships, which depend on
 * what the deployment asked for. Read when a scenario runs rather than when this is loaded,
 * because what says so is the environment `config.ts` writes.
 */
function explorer(): string[] {
  return find()
}

/** The broker, the database and the cache, on the ports a checkout binds them to. */
const PORTS = [31010, 31020, 31040]

/**
 * The shortest window a halt may ask for, so that a suite waiting one out per scenario waits
 * as little as it can. What a window too short costs a deployment is a cancelled halt rather
 * than a wrong one.
 */
const QUIESCENCE = 30
const GRACE = 2

const BOOT = 30_000
const SHUTDOWN = 15_000
const POLL = 250

/** A decision is the quiescence, the gap and the check, and a little over. */
const DEADLINE = 60_000

/** A cancel is all of that, the deadline on a check that goes unanswered, and the grace. */
const CANCEL = 90_000

/** A halt is at least thirty seconds, and the rebuild is spread over a little more. */
const RESUME = 60_000
