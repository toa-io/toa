import * as assert from 'node:assert'
import { fork, execFileSync, type ChildProcess } from 'node:child_process'
import { resolve } from 'node:path'
import { setTimeout } from 'node:timers/promises'
import { after, before, binding, given, then, when } from 'specumber'

import { load as parse } from 'js-yaml'
import * as stage from '@toa.io/userland/stage'
import { Redis } from 'ioredis'
import { environment } from '@toa.io/generic'
import { Realtime } from './Realtime.ts'
import { exceptions, type Component } from '@toa.io/core'

/** Dynamic routes, created and removed as an application does, and what they are refused with. */
@binding([Realtime])
export class Routes {
  private readonly realtime: Realtime
  private remote: Component | null = null
  private replica: ChildProcess | null = null
  private outcome: { reply?: unknown; exception?: unknown } | null = null
  private stopped = false
  private reported: string[] = []
  private error: typeof console.error | null = null

  public constructor(realtime: Realtime) {
    this.realtime = realtime
  }

  // the stash gives up on a command it cannot send in a minute and more
  @when('the route is created:', { timeout: 120_000 })
  public async create(yaml: string): Promise<void> {
    await this.call('route', yaml)
  }

  @when('the route is removed:')
  public async remove(yaml: string): Promise<void> {
    await this.call('unroute', yaml)

    assert.ok(this.outcome?.exception === undefined, 'The route was not removed')
  }

  @then('the route is refused with `{word}`')
  public refused(code: string): void {
    const reply = this.outcome?.reply as { code?: string } | null | undefined

    assert.equal(reply?.code, code, `Expected the route refused with '${code}'`)
  }

  // what the stash failed with, and not, for instance, a call to what does not exist
  @then('the route is refused with a system exception')
  public excepted(): void {
    const exception = this.outcome?.exception as
      | { code?: number; message?: string }
      | undefined

    assert.ok(exception !== undefined, 'Expected the route refused with an exception')
    assert.equal(exception.code, codes.System, exception.message ?? '')
  }

  @given('another replica of the service is running', { timeout: 60_000 })
  public async replicate(): Promise<void> {
    await this.realtime.serve()

    const replica = fork(resolve(import.meta.dirname, 'replica.mts'), {
      // what the suite set is in its own store, not in `process.env`
      env: { ...environment.entries(), TOA_REALTIME: this.realtime.declaration() },
      execArgv: ['--import', 'tsx'],
      stdio: ['ignore', 'ignore', 'inherit', 'ipc']
    })

    this.replica = replica

    await new Promise<void>((resolve, reject) => {
      replica.once('message', () => resolve())
      replica.once('exit', (code) => reject(new Error(`The replica exited with ${code}`)))
    })
  }

  @when('the route is created on the other replica:', { timeout: 60_000 })
  public async createElsewhere(yaml: string): Promise<void> {
    const replica = this.replica!
    const input = parse(yaml)

    this.outcome = await new Promise((resolve) => {
      replica.once('message', (message: { reply?: unknown; exception?: unknown }) =>
        resolve(message)
      )
      replica.send({ command: 'route', input })
    })

    assert.ok(this.outcome?.exception === undefined, String(this.outcome?.exception))
    assert.equal(this.outcome?.reply, null)
  }

  @when('the service is restarted', { timeout: 30_000 })
  public async restart(): Promise<void> {
    await this.realtime.restart()

    this.remote = null
  }

  @when('the stash is restarted', { timeout: 60_000 })
  public async restartStash(): Promise<void> {
    this.listen()
    compose('restart', 'redis0')

    // what reconnects does so on its own schedule, and reads the routes again once it has
    await setTimeout(3000)
  }

  @when('the stash is stopped', { timeout: 60_000 })
  public stopStash(): void {
    this.stopped = true
    this.listen()

    compose('stop', 'redis0')
  }

  // a client with nothing listening for its errors prints them to the console, past the logs
  @then('nothing is reported as unhandled')
  public unhandled(): void {
    const reported = this.reported.filter((line) => line.includes('Unhandled'))

    assert.equal(reported.length, 0, reported[0])
  }

  @when('{int} second(s) has/have passed', { timeout: 60_000 })
  public async pass(seconds: number): Promise<void> {
    await setTimeout(seconds * 1000)
  }

  // a run that did not get to its `after` leaves them too
  @before()
  public async clean(): Promise<void> {
    await forget()
  }

  @after()
  public async shutdown(): Promise<void> {
    if (this.error !== null) {
      console.error = this.error
      this.error = null
    }

    this.reported = []
    this.remote = null
    this.outcome = null

    if (this.replica !== null) {
      const replica = this.replica

      this.replica = null

      await new Promise<void>((resolve) => {
        replica.once('exit', () => resolve())
        replica.send({ command: 'stop' })
      })
    }

    if (this.stopped) {
      this.stopped = false

      compose('start', 'redis0')
    }

    await forget()
  }

  /** What is printed to the console from now on, and printed still. */
  private listen(): void {
    if (this.error !== null) return

    const error = console.error

    this.error = error

    console.error = (...args: unknown[]) => {
      this.reported.push(args.map(String).join(' '))
      error(...args)
    }
  }

  private async call(operation: string, yaml: string): Promise<void> {
    await this.realtime.serve()

    this.remote ??= await stage.remote('realtime.streams')

    const input = parse(yaml)

    try {
      this.outcome = { reply: await this.remote.invoke(operation, { input }) }
    } catch (exception) {
      this.outcome = { exception }
    }
  }
}

/** The routes a scenario created outlive it in the stash, and would be served to the next one. */
async function forget(): Promise<void> {
  const redis = new Redis('redis://localhost:31040', { lazyConnect: true })

  await redis.connect()
  await redis.del(`${environment.scope()}:realtime:streams:routes`)

  redis.disconnect()
}

const { codes } = exceptions

function compose(command: string, service: string): void {
  execFileSync('docker', ['compose', '-f', COMPOSE, command, service], {
    stdio: 'ignore'
  })
}

const COMPOSE = resolve(import.meta.dirname, '../../../../docker-compose.yaml')
