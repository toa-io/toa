import type { Redis } from 'ioredis'
import type { Logs } from '@toa.io/extensions.telemetry'
import type { Stash } from '@toa.io/extensions.stash'

/**
 * The dynamic routes, every one of them, in memory: every replica receives every event, and
 * matching one against a lookup in the stash would cost a round trip per event per replica.
 *
 * The stash holds them in one hash, of a route to the moment it expires. A change is published on a
 * channel every replica listens to, and the hash is read whole on mount, on every reconnect of the
 * listener — what was published while it was away is lost to it — and every half of `expire`,
 * which is what drops the routes nobody renews. `match` skips an expired route without waiting for
 * that.
 */
export class Routes {
  private readonly stash: Stash
  private readonly expire: number
  private readonly logs: Logs
  private readonly declarations: Map<string, Declaration>
  private index = new Map<string, Map<string, Entry>>()
  private listener: Redis | null = null
  private channel = ''
  private interval: NodeJS.Timeout | null = null

  // changes made while the hash is being read, which the read may predate
  private changes: Change[] | null = null

  public constructor(
    {
      stash,
      configuration,
      logs
    }: { stash: Stash; configuration: { expire: number }; logs: Logs },
    declarations: Map<string, Declaration>
  ) {
    this.stash = stash
    this.expire = configuration.expire * 1000
    this.logs = logs
    this.declarations = declarations
  }

  public async open(): Promise<void> {
    // a connection that subscribes can do nothing else, so it is one of its own
    const listener: Redis = await (this.stash as unknown as Redis).duplicate()

    // the prefix scopes keys and not channels, so the channel carries it itself
    this.channel = (listener.options.keyPrefix ?? '') + KEY
    this.listener = listener

    listener.on('message', (_: string, message: string) => this.hear(message))

    // it reconnects on its own, and reads the routes again when it has
    listener.on('error', (error: Error) =>
      this.logs.debug('Routes listener error', { error })
    )

    // `ready` follows every reconnect, and what was published meanwhile never arrives
    listener.on('ready', () => void this.read())

    await listener.subscribe(this.channel)
    await this.read()

    this.interval = setInterval(() => void this.read(), this.expire / 2)
  }

  public close(): void {
    if (this.interval !== null) clearInterval(this.interval)

    this.listener?.disconnect()
    this.listener = null
  }

  public async route(route: Route): Promise<Error | null> {
    const declaration = this.declarations.get(route.event)

    if (declaration === undefined) return ERR_NOT_DYNAMIC

    const expose = exposure(route.expose, declaration.expose)

    if (expose instanceof Error) return expose

    const stored: Route = { event: route.event, stream: route.stream }

    if (route.property !== undefined) {
      stored.property = route.property
      stored.value = route.value
    }

    if (expose !== undefined) stored.expose = expose

    const entry: Entry = { route: stored, expires: Date.now() + this.expire }
    const id = identify(stored)

    await this.write(id, entry)

    return null
  }

  public async unroute(route: Route): Promise<void> {
    const id = identify(route)

    await this.write(id, null)
  }

  /** Pushes the routes to the stream `expire` on from now: the stream is being consumed. */
  public async renew(stream: string): Promise<void> {
    const expires = Date.now() + this.expire
    const renewed: Array<[string, Entry]> = []

    for (const entries of this.index.values())
      for (const [id, entry] of entries)
        if (entry.route.stream === stream) {
          entry.expires = expires
          renewed.push([id, entry])
        }

    if (renewed.length === 0) return

    const fields = renewed.flatMap(([id, entry]) => [id, JSON.stringify(entry)])

    await this.stash.hset(KEY, ...fields)
  }

  /** What of an event goes to which stream. */
  public match(event: string, data: Record<string, unknown>): Array<[string, unknown]> {
    const entries = this.index.get(event)

    if (entries === undefined) return []

    const now = Date.now()
    const matches: Array<[string, unknown]> = []

    for (const { route, expires } of entries.values()) {
      if (expires < now) continue

      if (route.property !== undefined && !contains(data[route.property], route.value))
        continue

      matches.push([route.stream, fit(data, route.expose)])
    }

    return matches
  }

  private async write(id: string, entry: Entry | null): Promise<void> {
    const message = JSON.stringify({ id, entry })
    const transaction = (this.stash as unknown as Redis).multi()

    if (entry === null) transaction.hdel(KEY, id)
    else transaction.hset(KEY, id, JSON.stringify(entry))

    transaction.publish(this.channel, message)

    const results = await transaction.exec()

    for (const [error] of results ?? []) if (error !== null) throw error

    this.apply(id, entry)
  }

  private hear(message: string): void {
    const { id, entry } = JSON.parse(message) as Change

    this.apply(id, entry)
  }

  private apply(id: string, entry: Entry | null): void {
    this.changes?.push({ id, entry })
    set(this.index, id, entry)
  }

  private async read(): Promise<void> {
    if (this.changes !== null) return

    this.changes = []

    try {
      const hash = (await this.stash.hgetall(KEY)) as Record<string, string>
      const index = new Map<string, Map<string, Entry>>()
      const now = Date.now()
      const expired: string[] = []

      for (const [id, value] of Object.entries(hash)) {
        const entry = JSON.parse(value) as Entry

        if (entry.expires < now) expired.push(id)
        else set(index, id, entry)
      }

      for (const { id, entry } of this.changes) set(index, id, entry)

      this.index = index

      if (expired.length > 0) await this.stash.hdel(KEY, ...expired)
    } catch (error) {
      // the listener reads again once it is back, and so does the next interval
      this.logs.warn('Dynamic routes not read', { error })
    } finally {
      this.changes = null
    }
  }
}

function set(
  index: Map<string, Map<string, Entry>>,
  id: string,
  entry: Entry | null
): void {
  const event = (JSON.parse(id) as string[])[1]
  let entries = index.get(event)

  if (entry === null) {
    entries?.delete(id)

    if (entries?.size === 0) index.delete(event)

    return
  }

  if (entries === undefined) {
    entries = new Map()
    index.set(event, entries)
  }

  entries.set(id, entry)
}

/** A route is its stream, event, property and value; what it exposes is not part of it. */
function identify(route: Route): string {
  return JSON.stringify([
    route.stream,
    route.event,
    route.property ?? null,
    route.value ?? null
  ])
}

function exposure(
  requested?: string[],
  allowed?: string[]
): string[] | undefined | Error {
  if (requested === undefined) return allowed

  if (allowed !== undefined && requested.some((property) => !allowed.includes(property)))
    return ERR_EXPOSE

  return requested
}

function contains(property: unknown, value: unknown): boolean {
  return Array.isArray(property) ? property.includes(value) : property === value
}

function fit(data: Record<string, unknown>, expose?: string[]): unknown {
  if (expose === undefined) return data

  return Object.fromEntries(Object.entries(data).filter(([key]) => expose.includes(key)))
}

export interface Route {
  event: string
  property?: string
  value?: string
  stream: string
  expose?: string[]
}

export interface Declaration {
  expose?: string[]
}

interface Entry {
  route: Route
  expires: number
}

interface Change {
  id: string
  entry: Entry | null
}

const KEY = 'routes'

const ERR_NOT_DYNAMIC = new (class NotDynamicError extends Error {
  public readonly code = 'NOT_DYNAMIC'
  public override readonly message = 'The event is not declared dynamic'
})()

const ERR_EXPOSE = new (class ExposeError extends Error {
  public readonly code = 'EXPOSE'
  public override readonly message =
    'The route exposes what the declaration does not allow'
})()
