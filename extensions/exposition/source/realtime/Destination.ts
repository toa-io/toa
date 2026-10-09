import { console } from 'openspan'
import { Connector, type Locator } from '@toa.io/core'
import { APPEND, MAXLEN, Shards, shard } from './redis.ts'
import * as measure from './measurements.ts'
import { literal, type Route } from '@toa.io/definitions/extensions.exposition/realtime'
import type { outbox } from '@toa.io/core/types'

/**
 * Where a component's routed events go: the stream of each of their keys, and its channel. Each
 * event of a row is rendered by the component's own condition and payload, fitted to what its
 * route exposes, and written in one call per Redis its keys are kept on — to the streams of them
 * that exist, which are the ones that are consumed.
 *
 * At least once: a row written again by the pump is written to the streams again.
 */
export class Destination extends Connector implements outbox.Destination {
  public readonly name = 'realtime'
  public readonly renders: string[]
  public rendering?: outbox.Rendering

  private readonly locator: Locator
  private readonly routes: Route[]
  private shards: Shards | null = null

  public constructor(locator: Locator, routes: Route[]) {
    super()

    this.locator = locator
    this.routes = routes
    this.renders = [...new Set(routes.map(({ event }) => event))]
  }

  public async emit(row: outbox.Row): Promise<void> {
    const routed = await this.export(row)

    if (routed !== undefined) await this.write(routed)
  }

  /**
   * What the row is written to the streams as: each routed event with its keys and what its
   * route exposes of it. Another region writes it to its own streams as it stands, rendering
   * nothing, so a reader there is given what a reader here is.
   */
  public async export(row: outbox.Row): Promise<Routed[] | undefined> {
    const routed = await Promise.all(
      this.routes.map(async (route) => await this.route(route, row))
    )

    const events = routed.filter((one) => one !== null)

    return events.length === 0 ? undefined : events
  }

  /**
   * What another region's component exported, written to the streams of this one. What is not
   * the shape an export has would be refused however often it came again, so it is not written.
   */
  public async import(portable: unknown): Promise<void> {
    if (!Array.isArray(portable) || !portable.every(routed)) {
      console.error('Realtime import is not what an export is', {
        component: this.locator.id
      })

      return
    }

    await this.write(portable)
  }

  protected override async open(): Promise<void> {
    const shards = new Shards()

    for (const redis of shards.connections) {
      // it reconnects on its own; a write while it is away fails, and the outbox writes it again
      redis.on('error', (error: NodeJS.ErrnoException) =>
        console.debug('Realtime streams unreachable', {
          error: error.code ?? error.message
        })
      )

      redis.defineCommand('append', { lua: APPEND })
    }

    this.shards = shards

    await shards.connect()
  }

  protected override async close(): Promise<void> {
    this.shards?.disconnect()
    this.shards = null
  }

  private async route(route: Route, row: outbox.Row): Promise<Routed | null> {
    const raised = await this.rendering!.render(route.event, row)

    if (raised === null) return null

    const payload = raised.payload as Record<string, unknown>
    const keys = keysOf(payload, route)

    if (keys.length === 0) return null

    return {
      event: `${this.locator.id}.${route.event}`,
      keys,
      data: fit(payload, route.expose)
    }
  }

  private async write(routed: Routed[]): Promise<void> {
    await Promise.all(routed.map(async (one) => await this.append(one)))
  }

  private async append({ event, keys, data }: Routed): Promise<void> {
    const serialized = JSON.stringify(data)
    const connections = this.shards!.connections
    const byShard = new Map<number, string[]>()

    for (const key of keys) {
      const i = shard(key, connections.length)

      byShard.set(i, [...(byShard.get(i) ?? []), key])
    }

    const writes = [...byShard].map(
      async ([i, keys]) =>
        await (connections[i] as unknown as Append).append(
          keys.length,
          ...keys,
          event,
          serialized,
          MAXLEN
        )
    )

    await Promise.all(writes)

    measure.route(event)
  }
}

/** A routed event as it is written: to the streams of its keys, under its name. */
interface Routed {
  event: string
  keys: string[]
  data: unknown
}

function routed(value: unknown): value is Routed {
  const { event, keys } = (value ?? {}) as Partial<Routed>

  return (
    typeof event === 'string' &&
    Array.isArray(keys) &&
    keys.every((key) => typeof key === 'string')
  )
}

/**
 * The values of the key properties, each a key or a list of them, and the literals. A value that
 * reads as a literal is not a key: whoever writes it does not reach a literal's stream.
 */
function keysOf(payload: Record<string, unknown>, route: Route): string[] {
  const keys = new Set<string>()

  for (const property of route.properties) {
    const value = payload?.[property]
    const values = Array.isArray(value) ? value : [value]

    for (const key of values) if (typeof key === 'string' && !literal(key)) keys.add(key)
  }

  for (const key of route.literals) keys.add(key)

  return [...keys]
}

/** What the route names of the payload, and nothing else. */
function fit(payload: Record<string, unknown>, expose: string[]): unknown {
  return Object.fromEntries(
    Object.entries(payload).filter(([key]) => expose.includes(key))
  )
}

interface Append {
  append(count: number, ...args: Array<string | number>): Promise<unknown>
}
