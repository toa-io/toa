import { console } from 'openspan'
import { Connector, type Locator } from '@toa.io/core'
import { APPEND, MAXLEN, connect, prefix } from './redis.ts'
import * as measure from './measurements.ts'
import type { Redis } from 'ioredis'
import type { Route } from '@toa.io/definitions/extensions.exposition/realtime'
import type { outbox } from '@toa.io/core/types'

/**
 * Where a component's routed events go: the stream of each of their keys, and its channel. Each
 * event of a row is rendered by the component's own condition and payload, fitted to what its
 * route exposes, and written in one call — to the streams of its keys that exist, which are the
 * ones that are consumed.
 *
 * At least once: a row written again by the pump is written to the streams again.
 */
export class Destination extends Connector implements outbox.Destination {
  public readonly name = 'realtime'
  public readonly renders: string[]
  public rendering?: outbox.Rendering

  private readonly locator: Locator
  private readonly routes: Route[]
  private redis: Redis | null = null

  public constructor(locator: Locator, routes: Route[]) {
    super()

    this.locator = locator
    this.routes = routes
    this.renders = [...new Set(routes.map(({ event }) => event))]
  }

  public async emit(row: outbox.Row): Promise<void> {
    const writes = this.routes.map(async (route) => await this.route(route, row))

    await Promise.all(writes)
  }

  protected override async open(): Promise<void> {
    const redis = connect({ keyPrefix: prefix() })

    // it reconnects on its own; a write while it is away fails, and the outbox writes it again
    redis.on('error', (error: NodeJS.ErrnoException) =>
      console.debug('Realtime streams unreachable', {
        error: error.code ?? error.message
      })
    )

    redis.defineCommand('append', { lua: APPEND })

    this.redis = redis

    await redis.connect()
  }

  protected override async close(): Promise<void> {
    this.redis?.disconnect()
    this.redis = null
  }

  private async route(route: Route, row: outbox.Row): Promise<void> {
    const raised = await this.rendering!.render(route.event, row)

    if (raised === null) return

    const payload = raised.payload as Record<string, unknown>
    const keys = keysOf(payload, route.properties)

    if (keys.length === 0) return

    const event = `${this.locator.id}.${route.event}`
    const data = JSON.stringify(fit(payload, route.expose))

    await (this.redis as unknown as Append).append(
      keys.length,
      ...keys,
      event,
      data,
      MAXLEN
    )

    measure.route(event)
  }
}

/** The values of the key properties: each a key, or a list of them. */
function keysOf(payload: Record<string, unknown>, properties: string[]): string[] {
  const keys = new Set<string>()

  for (const property of properties) {
    const value = payload?.[property]
    const values = Array.isArray(value) ? value : [value]

    for (const key of values) if (typeof key === 'string') keys.add(key)
  }

  return [...keys]
}

function fit(payload: Record<string, unknown>, expose?: string[]): unknown {
  if (expose === undefined) return payload

  return Object.fromEntries(
    Object.entries(payload).filter(([key]) => expose.includes(key))
  )
}

interface Append {
  append(count: number, ...args: Array<string | number>): Promise<unknown>
}
