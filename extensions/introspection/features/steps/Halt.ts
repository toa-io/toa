import assert from 'node:assert'
import { type ChildProcess, execFileSync, fork } from 'node:child_process'
import { resolve } from 'node:path'
import { setTimeout } from 'node:timers/promises'
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
    await this.run(EXPLORER, [component('probe.source'), component('probe.target')])
  }

  @given('a running deployment with a component that keeps its own time')
  public async busy(): Promise<void> {
    // `probe.source` because `probe.target` receives its event, and a receiver looks its
    // source up before the process is up
    await this.run(EXPLORER, [
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

  @when('the explorer is killed')
  public async kill(): Promise<void> {
    const explorer = this.fleet[0]

    explorer.child.kill('SIGKILL')
    explorer.dead = true
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
      await eventually(() => held(member.child.pid!) > 0, 'a process holds no connection', RESUME)
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

  private live(): Member[] {
    return this.fleet.filter((member) => !member.dead)
  }
}

async function member(paths: string[]): Promise<Member> {
  const child = fork(MEMBER, [JSON.stringify(paths)], {
    env: environment.entries(),
    // what a member says of itself comes over the channel; its output is the run's
    stdio: ['ignore', 'ignore', 'inherit', 'ipc']
  })

  const state: State = { running: false, quiescent: false }
  const instance: Member = { child, state, dead: false }

  child.on('exit', () => {
    instance.dead = true
  })

  await new Promise<void>((resolve, reject) => {
    child.on('message', (message: Report | string) => {
      // the readiness probe of a process says `ready` over the same channel
      if (typeof message !== 'object') return

      if ('up' in message) resolve()
      else Object.assign(state, message)
    })

    child.on('error', reject)

    void setTimeout(BOOT).then(() => {
      reject(new Error('a process did not come up'))
    })
  })

  return instance
}

async function ended(member: Member): Promise<void> {
  if (member.dead) return

  await new Promise<void>((resolve) => {
    member.child.on('exit', () => {
      resolve()
    })

    void setTimeout(SHUTDOWN).then(() => {
      member.child.kill('SIGKILL')
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
  failure: string,
  limit = DEADLINE
): Promise<void> {
  const deadline = Date.now() + limit

  while (Date.now() < deadline) {
    if (condition()) return

    await setTimeout(POLL)
  }

  assert.fail(failure)
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
  dead: boolean
}

interface State {
  running: boolean
  quiescent: boolean
}

type Report = State | { up: true }

const MEMBER = resolve(import.meta.dirname, 'fleet', 'member.js')

/** The explorer, as a deployment runs it: the components this extension ships. */
const EXPLORER = find()

/** The broker, the database and the cache, on the ports a checkout binds them to. */
const PORTS = [31010, 31020, 31040]

/**
 * The shortest window worth having, so that a suite that waits one out per scenario is worth
 * running. What it costs a deployment that needs longer is a cancelled halt, not a wrong one.
 */
const QUIESCENCE = 5
const GRACE = 2

const BOOT = 30_000
const SHUTDOWN = 15_000
const DEADLINE = 20_000
const POLL = 250

/** A cancel is the quiescence, the gap, the check and the grace, and a little over. */
const CANCEL = 30_000

/** A halt is at least thirty seconds, and the rebuild is spread over a little more. */
const RESUME = 60_000
