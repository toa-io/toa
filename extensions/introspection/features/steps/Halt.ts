import assert from 'node:assert'
import { execFileSync } from 'node:child_process'
import { resolve } from 'node:path'
import { setTimeout } from 'node:timers/promises'
import tsflow from 'cucumber-tsflow'

import * as boot from '@toa.io/boot'
import { Locator } from '@toa.io/core'
import { environment } from '@toa.io/generic'
import type { Component, Connector } from '@toa.io/core'

const { after, binding, given, then, when } = tsflow

// what a halt is asked for the moment a signal lands, rather than two seconds later
environment.set('TOA_HALT_LEAD', '100')

/**
 * A halt is about a process, so this boots one — a `Workload`, the way `toa compose` does —
 * rather than a composition. What it holds is the signals component and one of its own, and
 * nothing else in this process connects to the infrastructure, so the sockets on those ports
 * are the workload's and no one else's.
 */
@binding()
export class Halt {
  private workload: Connector | null = null
  private signals: Component | null = null

  @given('a running process')
  public async run(): Promise<void> {
    this.workload = new boot.Workload(
      async (workload) => await workload.gate(async () => await boot.composition(COMPONENTS))
    )

    await this.workload.connect()

    // the listener subscribes in the background, and the component it subscribes to is one
    // this same process is still starting
    await this.settled()
  }

  @when('a halt of {int} seconds is signalled')
  public async signal(seconds: number): Promise<void> {
    this.signals ??= await boot.remote(new Locator('signals', 'introspection'))

    await this.signals.connect()

    const reply = await this.signals.invoke('create', {
      input: { type: 'halt', seconds }
    })

    assert.equal(reply.error, undefined, `Signal refused: ${JSON.stringify(reply)}`)

    // its own connection is not the process's, and would be counted as one
    await this.signals.disconnect()

    this.signals = null
  }

  @then('the process holds no connection')
  public async none(): Promise<void> {
    await this.eventually(
      (held) => held === 0,
      'the process still holds connections'
    )
  }

  @then('the process holds connections again')
  public async again(): Promise<void> {
    await this.eventually((held) => held > 0, 'the process holds no connection', RESUME)
  }

  @after('@halt')
  public async shutdown(): Promise<void> {
    await this.signals?.disconnect()
    await this.workload?.disconnect()

    this.signals = null
    this.workload = null
  }

  /** Every socket this process holds to the database, the broker and the cache. */
  private held(): number {
    const out = execFileSync('ss', ['-tnp'], { encoding: 'utf8' })

    return out
      .split('\n')
      .filter((line) => line.includes(`pid=${process.pid},`))
      .filter((line) => PORTS.some((port) => line.includes(`:${port} `))).length
  }

  private async settled(): Promise<void> {
    await setTimeout(2000)
  }

  private async eventually(
    condition: (held: number) => boolean,
    failure: string,
    limit = DEADLINE
  ): Promise<void> {
    const deadline = Date.now() + limit

    while (Date.now() < deadline) {
      if (condition(this.held())) return

      await setTimeout(POLL)
    }

    assert.fail(`${failure} (${this.held()})`)
  }
}

const ROOT = resolve(import.meta.dirname, '../../..')

/*
 * The signals component alone: it stores, so it holds the database, and it serves, so it
 * holds the broker — which is the whole of what this has to see close. A component that
 * receives another's events would have this process look one up that it does not run.
 */
const COMPONENTS = [resolve(ROOT, 'introspection/components/introspection.signals')]

/** The broker, the database and the cache, on the ports a checkout binds them to. */
const PORTS = [31010, 31020, 31040]

const DEADLINE = 10_000
const POLL = 250

/** A halt is at least thirty seconds, and the rebuild is spread over a little more. */
const RESUME = 45_000
