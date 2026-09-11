import { readFileSync } from 'node:fs'
import { Client } from './client.ts'
import * as fixtures from './fixtures.ts'
import { send } from './oha.ts'
import type { LoadResult } from './load.ts'
import type { Running } from './processes.ts'
import type { Run } from './run.ts'
import type { Fixtures, Scenario } from './scenarios.ts'

export interface Load {
  duration: number
  /** without one, as fast as the side answers */
  rate?: number
}

/** One running side, and what is sent to it. */
export class Driver {
  public readonly running: Running
  private readonly run: Run
  private readonly client: Client
  private readonly fixtures: Fixtures

  private constructor(run: Run, running: Running, fixtures: Fixtures) {
    this.run = run
    this.running = running
    this.fixtures = fixtures
    // the host with its port, as the load names it and as the gateway's authorities map it
    this.client = new Client(running.origin, `${HOST}:${running.side.ports.gateway}`, running.protocol)
  }

  /** A side with the items seeded, where the scenarios read them. */
  public static async prepare(run: Run, running: Running, seeded: boolean): Promise<Driver> {
    const driver = new Driver(run, running, { tokens: run.tokens, files: run.files, item: '' })

    if (seeded) driver.fixtures.item = await fixtures.seed(driver.client, ITEMS)

    return driver
  }

  /** A message where the side answers the scenario otherwise than it should. */
  public async check(scenario: Scenario): Promise<string | null> {
    const reply = await this.client.send({
      method: scenario.method,
      path: scenario.path(this.fixtures),
      headers: scenario.headers?.(this.fixtures),
      body: scenario.body === undefined ? undefined : readFileSync(scenario.body(this.fixtures), 'utf8')
    })

    if (reply.status !== scenario.status)
      return `answered ${reply.status} with ${JSON.stringify(reply.body)?.slice(0, 200)}`

    return scenario.check(reply, this.fixtures)
  }

  public async load(scenario: Scenario, load: Load): Promise<LoadResult> {
    const port = this.running.side.ports.gateway
    const authority = `${HOST}:${port}`

    return await send(
      {
        url: `http://${authority}${scenario.path(this.fixtures)}`,
        method: scenario.method,
        headers: scenario.headers?.(this.fixtures) ?? {},
        connect: `${authority}:127.0.0.1:${port}`,
        body: scenario.body?.(this.fixtures),
        duration: load.duration,
        connections: CONNECTIONS,
        rate: load.rate,
        http2: scenario.protocol === 'h2c'
      },
      { cpus: this.run.placement.load, status: scenario.status }
    )
  }

  /** The rate every window of the scenario is sent at: a share of what the side saturates at. */
  public async calibrate(scenario: Scenario): Promise<number> {
    await this.load(scenario, { duration: this.run.timing.warmup })

    const saturated = await this.load(scenario, { duration: SATURATION })

    return Math.max(10, Math.floor(saturated.rate * LOAD))
  }

  public close(): void {
    this.client.close()
  }
}

const HOST = fixtures.HOST
const ITEMS = 1000
const CONNECTIONS = 32
const SATURATION = 5

/** of saturation: a rate the side keeps up with, so latency is not the length of a queue */
const LOAD = 0.5
