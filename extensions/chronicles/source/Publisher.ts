import { createConnection } from 'node:net'
import { connect } from 'comq'
import { console } from 'openspan'
import { Connector } from '@toa.io/core'
import { EXCHANGE } from '@toa.io/definitions/extensions.chronicles'
import type { IO } from 'comq'
import type { Encounter, Row, State } from './Provider.ts'
import type { User } from './settings.ts'

/**
 * Rows to the broker of the log: each a JSON message to the exchange `chronicles` under the key of
 * its table, with the scope of the context and when it expires. A publication resolves once the
 * broker has confirmed it, which is what the caller acknowledges what it carried by.
 *
 * The connection is made by the first publication and not before, and nothing waits for it to
 * start: while the broker is away, a publication waits for it, and what it carries waits, unacknowledged,
 * where it came from.
 */
export class Publisher extends Connector {
  private readonly url: string
  private readonly scope: string
  private readonly retention: number | undefined
  private io?: Promise<IO>
  private opened?: IO

  /** aborted as the publisher stops: what waits for the broker then gives up, to be delivered again */
  private closing = new AbortController()
  private stopped = false

  /** where it publishes, which a publisher of other settings does not */
  public readonly address: string

  // eslint-disable-next-line max-params
  public constructor(address: string, user: User, scope: string, retention?: number) {
    super()

    this.address = address

    const url = new URL(address)

    url.username = encodeURIComponent(user.username)
    url.password = encodeURIComponent(user.password)

    this.url = url.href
    this.scope = scope
    this.retention = retention
  }

  public async publish(
    rows: Row[],
    states: State[] = [],
    encounters: Encounter[] = []
  ): Promise<void> {
    if (this.stopped) throw new Error('The chronicles are stopping')

    const io = await this.connection()

    await Promise.all([
      ...rows.map(async (row) => await this.route(io, 'events', row, row.time)),
      ...states.map(async (state) => await this.route(io, 'states', state)),
      ...encounters.map(
        async (encounter) =>
          await this.route(io, 'encounters', encounter, encounter.received)
      )
    ])
  }

  /**
   * Fails what waits for the broker, and what is published from now on, so the service publishing
   * through it is not held open by what would wait for the broker past the service's own end: it
   * is delivered again, to this process or another.
   */
  public get done(): boolean {
    return this.stopped
  }

  public stop(): void {
    this.stopped = true
    this.closing.abort()
  }

  protected override async open(): Promise<void> {
    this.stopped = false
    this.closing = new AbortController()
  }

  /**
   * A connection still being made is not waited for — it may never be — but closed once it is,
   * and what waits for it is failed, so it is delivered again, to this process or another.
   */
  protected override async close(): Promise<void> {
    const { io, opened } = this

    this.io = undefined
    this.opened = undefined
    this.stop()

    if (opened !== undefined) await opened.close()
    else
      void io?.then(
        async (late) => await late.close(),
        () => undefined
      )
  }

  private async connection(): Promise<IO> {
    this.io ??= reachable(this.url, this.closing.signal)
      .then(async () => await connect(this.url))
      .then(
        (io) => {
          this.opened = io

          return io
        },
        (error: unknown) => {
          this.io = undefined

          console.warn('Chronicles failed to reach their broker', {
            error: error instanceof Error ? error.message : String(error)
          })

          throw error
        }
      )

    const { signal } = this.closing

    // a publication waits for the broker a while, and then fails, so what it carries is
    // delivered again rather than held: a process that stops is not kept by one that never ends
    return await new Promise<IO>((resolve, reject) => {
      function away(): void {
        reject(new Error('The broker of the chronicles is away'))
      }

      function closing(): void {
        reject(new Error('The chronicles are closing'))
      }

      const timer = setTimeout(away, WAIT)

      signal.addEventListener('abort', closing, { once: true })

      this.io!.then(resolve, reject).finally(() => {
        clearTimeout(timer)
        signal.removeEventListener('abort', closing)
      })
    })
  }

  // eslint-disable-next-line max-params
  private async route(
    io: IO,
    table: string,
    row: Row | State | Encounter,
    from?: number
  ): Promise<void> {
    const body = message(
      row,
      this.scope,
      from === undefined ? null : expires(from, this.retention)
    )

    await io.route(EXCHANGE, table, body, 'application/json')
  }
}

/**
 * Resolves once the broker accepts a connection, trying again until it does or `signal` aborts.
 * A connection is asked of comq only then: one it is asked for keeps trying for as long as it
 * takes, and is no longer the publisher's to give up.
 */
async function reachable(url: string, signal: AbortSignal): Promise<void> {
  const { protocol, hostname, port } = new URL(url)
  const target = { host: hostname, port: Number(port === '' ? DEFAULT[protocol] : port) }

  while (!signal.aborted) {
    const reached = await new Promise<boolean>((resolve) => {
      const socket = createConnection(target)

      function settle(ok: boolean): void {
        socket.destroy()
        resolve(ok)
      }

      socket.setTimeout(PROBE)
      socket.once('connect', () => settle(true))
      socket.once('timeout', () => settle(false))
      socket.once('error', () => settle(false))
    })

    if (reached) return

    await new Promise((resolve) => setTimeout(resolve, PROBE).unref())
  }

  throw new Error('The chronicles are closing')
}

/**
 * A row as the store reads it: of a scope, its times in the store's format, and when it expires,
 * where it does.
 */
export function message(
  row: Row | State | Encounter,
  scope: string,
  until: string | null
): Record<string, unknown> {
  const body: Record<string, unknown> = { scope, ...row, time: timestamp(row.time) }

  if ('received' in row) body.received = timestamp(row.received)

  if (until !== null) body.expires = until

  return body
}

/** When a row stops being kept: its time and the retention, or the end of the store's time. */
export function expires(from: number, retention: number | undefined): string {
  if (retention === undefined) return FOREVER

  return timestamp(from + retention * DAY).slice(0, 19)
}

/** A `DateTime64(3)` as the store reads one without guessing: UTC, to the millisecond. */
export function timestamp(ms: number): string {
  return new Date(ms).toISOString().replace('T', ' ').replace('Z', '')
}

const DAY = 86_400_000

/** milliseconds a publication waits for the broker */
const WAIT = 10_000

/** milliseconds a try to reach the broker takes, and between two of them */
const PROBE = 1_000

const DEFAULT: Record<string, number> = { 'amqp:': 5672, 'amqps:': 5671 }
const FOREVER = '2106-01-01 00:00:00'
