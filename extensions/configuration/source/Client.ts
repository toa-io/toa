import { console } from 'openspan'
import { Connector, Locator } from '@toa.io/core'
import { EVENT, SOURCE } from './const'
import type { Message, Remote } from '@toa.io/core'
import type { Bootloader } from './Factory'

/**
 * One per process: one remote to the values service and one subscription to its events,
 * shared by every Aspect. What the Aspects ask for is collected and sent as one call.
 */
export class Client extends Connector {
  /** Disconnected once, a connector keeps what it depended on, so a gone client is not reused. */
  public disposed = false

  private readonly boot: Bootloader
  private readonly options: Options
  private readonly pending = new Map<string, Pending>()
  private readonly listeners = new Map<string, Set<Listener>>()
  private remote: Remote | null = null
  private timer: NodeJS.Timeout | null = null
  private flushing = false
  private fresh = false
  private round = 0

  public constructor (boot: Bootloader, options: Partial<Options> = {}) {
    super()

    this.boot = boot
    this.options = { ...DEFAULTS, ...options }
  }

  /**
   * The configuration of a component for an epoch. Resolves once the service has one;
   * with `wait` off, resolves with `null` as soon as the service says it has none.
   */
  public async fetch (component: string, epoch: string, wait = true): Promise<object | null> {
    const key = id(component, epoch)

    let entry = this.pending.get(key)

    if (entry === undefined) {
      entry = { component, epoch, waiters: [] }
      this.pending.set(key, entry)
    }

    const promise = new Promise<object | null>((resolve) => {
      entry!.waiters.push({ resolve, wait })
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
    this.remote = await this.boot.remote(LOCATOR, SOURCE)

    this.depends(this.remote)
    await this.remote.connect()

    const subscription = new Subscription((payload) => {
      void this.refresh(payload)
    })

    const consumer = await this.boot.receive(EVENT, subscription)

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

  private settle (output: Fetched[]): void {
    for (const { component, epoch, configuration } of output) {
      const key = id(component, epoch)
      const entry = this.pending.get(key)

      if (entry === undefined)
        continue

      if (configuration === null)
        this.postpone(key, entry)
      else
        this.deliver(key, entry, configuration)
    }
  }

  /** Those who would not wait are told, the rest stay for the next round. */
  private postpone (key: string, entry: Pending): void {
    entry.waiters = entry.waiters.filter(({ resolve, wait }) => {
      if (!wait) resolve(null)

      return wait
    })

    if (entry.waiters.length === 0)
      this.pending.delete(key)
  }

  private deliver (key: string, entry: Pending, configuration: object): void {
    this.pending.delete(key)

    for (const { resolve } of entry.waiters)
      resolve(configuration)
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

  private async refresh ({ component, epoch }: Created): Promise<void> {
    const listeners = this.listeners.get(id(component, epoch))

    if (listeners === undefined || listeners.size === 0)
      return

    const configuration = await this.fetch(component, epoch, false)

    if (configuration === null) {
      console.warn('Configuration is no longer served', { component, epoch })

      return
    }

    for (const listener of listeners)
      listener(configuration)
  }
}

/** What the event consumer hands deliveries to. */
class Subscription extends Connector {
  private readonly handler: (payload: Created) => void

  public constructor (handler: (payload: Created) => void) {
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

export interface Created {
  component: string
  epoch: string
}

export interface Fetched extends Created {
  configuration: object | null
}

export type Listener = (configuration: object) => void

interface Pending extends Created {
  waiters: Waiter[]
}

interface Waiter {
  resolve: (configuration: object | null) => void
  wait: boolean
}
