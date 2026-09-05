import { console } from 'openspan'
import { Connector, Locator } from '@toa.io/core'
import { EVENT, SOURCE } from './const.js'
import type { Remote } from '@toa.io/core'
import type { Message } from '@toa.io/core/types'
import type { Host } from './Factory.js'

/**
 * One per process: one remote to the values service and one subscription to its events,
 * shared by every Aspect. What the Aspects ask for is collected and sent as one call;
 * what the service creates afterwards is handed to whoever subscribed.
 */
export class Client extends Connector {
  /** Disconnected once, a connector keeps what it depended on, so a gone client is not reused. */
  public disposed = false

  private readonly host: Host
  private readonly options: Options
  private readonly pending = new Map<string, Pending>()
  private readonly listeners = new Map<string, Set<Listener>>()
  private remote: Remote | null = null
  private timer: NodeJS.Timeout | null = null
  private flushing = false
  private fresh = false
  private round = 0

  public constructor (host: Host, options: Partial<Options> = {}) {
    super()

    this.host = host
    this.options = { ...DEFAULTS, ...options }
  }

  /** The configuration of a component for an epoch, once the service has one. */
  public async fetch (component: string, epoch: string): Promise<Value> {
    const key = id(component, epoch)

    let entry = this.pending.get(key)

    if (entry === undefined) {
      entry = { component, epoch, waiters: [] }
      this.pending.set(key, entry)
    }

    const promise = new Promise<Value>((resolve) => {
      entry!.waiters.push(resolve)
    })

    if (this.flushing)
      this.fresh = true
    else
      this.schedule(0)

    return await promise
  }

  public subscribe (component: string, epoch: string, listener: Listener): void {
    const key = id(component, epoch)

    if (!this.listeners.has(key))
      this.listeners.set(key, new Set())

    this.listeners.get(key)!.add(listener)
  }

  public unsubscribe (component: string, epoch: string, listener: Listener): void {
    this.listeners.get(id(component, epoch))?.delete(listener)
  }

  protected override async open (): Promise<void> {
    this.remote = await this.host.remote(LOCATOR, SOURCE)

    this.depends(this.remote)
    await this.remote.connect()

    const subscription = new Subscription(this.deliver.bind(this))
    const consumer = await this.host.receive(EVENT, subscription)

    this.depends(consumer)
    await consumer.connect()
  }

  protected override async close (): Promise<void> {
    if (this.timer !== null) {
      clearTimeout(this.timer)
      this.timer = null
    }
  }

  protected override async dispose (): Promise<void> {
    this.disposed = true
  }

  private schedule (delay: number): void {
    if (this.flushing)
      return

    if (this.timer !== null) {
      // a request that has just arrived does not wait for the round already planned
      if (delay > 0)
        return

      clearTimeout(this.timer)
    }

    this.timer = setTimeout(() => {
      void this.flush()
    }, delay)
  }

  private async flush (): Promise<void> {
    this.timer = null
    this.flushing = true
    this.fresh = false

    const batch = [...this.pending.values()]
    const input = batch.map(({ component, epoch }) => ({ component, epoch }))

    try {
      const output = await this.remote!.invoke<Fetched[] | Error>('fetch', { input })

      if (output instanceof Error)
        throw output

      this.settle(output)
    } catch (error) {
      console.warn('Configuration fetch failed', { error })
    } finally {
      this.flushing = false
    }

    this.report(batch)

    if (this.pending.size === 0)
      return

    if (this.fresh)
      this.schedule(0)
    else
      this.schedule(this.backoff())
  }

  /** Those the service has served are told; the rest stay for the next round. */
  private settle (output: Fetched[]): void {
    for (const { component, epoch, configuration, created } of output) {
      if (configuration === null)
        continue

      const key = id(component, epoch)
      const entry = this.pending.get(key)

      if (entry === undefined)
        continue

      this.pending.delete(key)

      for (const resolve of entry.waiters)
        resolve({ configuration, created })
    }
  }

  private report (batch: Pending[]): void {
    const waiting = batch
      .filter(({ component, epoch }) => this.pending.has(id(component, epoch)))
      .map(({ component }) => component)

    if (waiting.length === 0) {
      this.round = 0

      return
    }

    this.round++

    if (this.round % this.options.warn === 1)
      console.warn('Waiting for configuration', { components: waiting, round: this.round })
  }

  private backoff (): number {
    return Math.min(this.options.base * Math.pow(FACTOR, this.round), this.options.max)
  }

  /** A created object goes to the subscribers of its component and epoch, as it is. */
  private deliver (created: Created): void {
    const listeners = this.listeners.get(id(created.component, created.epoch))

    if (listeners === undefined)
      return

    const value: Value = { configuration: created.configuration, created: created._created }

    for (const listener of listeners)
      listener(value)
  }
}

/** What the event consumer hands deliveries to. */
class Subscription extends Connector {
  private readonly handler: (created: Created) => void

  public constructor (handler: (created: Created) => void) {
    super()

    this.handler = handler
  }

  public async receive (message: Message<Created>): Promise<void> {
    this.handler(message.payload)
  }
}

function id (component: string, epoch: string): string {
  return component + '\0' + epoch
}

const LOCATOR = new Locator('values', 'configuration')
const FACTOR = 1.5

const DEFAULTS: Options = {
  base: 1000,
  max: 10000,
  warn: 5
}

export interface Options {
  base: number
  max: number
  /** Every n-th round of waiting is reported. */
  warn: number
}

/** A configuration and when it was created; `0` for the deployed defaults. */
export interface Value {
  configuration: object
  created: number
}

export interface Fetched {
  component: string
  epoch: string
  configuration: object | null
  created: number
}

/** The `configuration.values.created` payload: the object as stored. */
export interface Created {
  component: string
  epoch: string
  configuration: object
  _created: number
}

export type Listener = (value: Value) => void

interface Pending {
  component: string
  epoch: string
  waiters: Array<(value: Value) => void>
}
