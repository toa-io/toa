import { current, encode } from 'openspan'
import { Connector, exceptions } from '@toa.io/core'
import { CLIENT, INGESTION, NAMESPACE } from '@toa.io/definitions/extensions.chronicles'
import type { Row } from './Provider.ts'
import type { Writer } from './Writer.ts'

/**
 * What `chronicles.ingestion` writes what browsers send through: each event under `client.<name>`,
 * with the client's own id and time, all of a batch in one write, and answered once it is.
 */
export class Client extends Connector {
  public readonly name = 'chronicles'

  private readonly writer: () => Writer

  public constructor(writer: () => Writer) {
    super()

    this.writer = writer
  }

  public async invoke(method: string, ...args: any[]): Promise<unknown> {
    if (method !== 'ingest')
      throw new exceptions.MisuseException(`Chronicles have no '${method}'`)

    return await this.ingest(args[0], args[1] ?? null)
  }

  /**
   * `identity` is the one the gateway verified the caller to be, from the path; `null` for the
   * route anyone may call, whose body is then refused where it says whose it is.
   */
  private async ingest(
    input: unknown,
    identity: string | null
  ): Promise<Accepted | Error> {
    const events = parse(input, identity !== null)

    if (events instanceof Error) return events

    const context = current()
    const trace = context === undefined ? null : encode(context)

    const rows = events.map((event): Row => ({
      id: event.id,
      label: `${CLIENT}.${event.name}`,
      component: COMPONENT,
      time: event.time,
      entity: null,
      version: null,
      identity,
      trace,
      payload: event.payload ?? {}
    }))

    await this.writer().write(rows)

    return { status: 202, accepted: rows.length }
  }
}

/**
 * A batch, `{ events }`, from JSON or from the text `navigator.sendBeacon` sends, which the gateway
 * hands over as a string. Checked here rather than by the operation's schema, which cannot read a
 * string. `identified` is whether the gateway put the identity in, which is then the one key
 * beside `events` the body may have.
 */
function parse(input: unknown, identified: boolean): Event[] | Error {
  let body = input

  if (typeof body === 'string')
    try {
      body = JSON.parse(body)
    } catch {
      return invalid('The body is not JSON')
    }

  if (typeof body !== 'object' || body === null || Array.isArray(body))
    return invalid('The body is `{ events }`')

  const { events, identity, ...rest } = body as Record<string, unknown>
  const extra = Object.keys(rest)

  if (extra.length > 0) return invalid(`The body has no '${extra[0]}'`)

  // the identity is the path's, never the body's
  if (!identified && identity !== undefined)
    return invalid(
      'The body names no identity: a client that has one sends it in the path'
    )

  if (!Array.isArray(events)) return invalid('`events` is an array of events')

  if (events.length > MAX_EVENTS)
    return invalid(`A request carries at most ${MAX_EVENTS} events`)

  for (const [index, event] of events.entries()) {
    const problem = check(event)

    if (problem !== null) return invalid(problem, index)

    if (JSON.stringify(event.payload ?? {}).length > MAX_PAYLOAD)
      return new Error('OVERSIZED', {
        cause: { index, message: `A payload is at most ${MAX_PAYLOAD} bytes of JSON` }
      })
  }

  return events as Event[]
}

function check(event: unknown): string | null {
  if (typeof event !== 'object' || event === null || Array.isArray(event))
    return 'An event is an object'

  const { id, name, time, payload, ...rest } = event as Record<string, unknown>

  if (Object.keys(rest).length > 0) return `An event has no '${Object.keys(rest)[0]}'`

  if (typeof id !== 'string' || id.length === 0 || id.length > 64)
    return '`id` is a string of 1 to 64 characters'

  if (typeof name !== 'string' || name.length > 64 || !NAME.test(name))
    return '`name` is lowercase segments separated by dots, at most 64 characters'

  if (!Number.isInteger(time) || (time as number) < 0)
    return '`time` is milliseconds since the epoch'

  if (
    payload !== undefined &&
    (typeof payload !== 'object' || payload === null || Array.isArray(payload))
  )
    return '`payload` is an object'

  return null
}

function invalid(message: string, index?: number): Error {
  return new Error('INVALID', {
    cause: index === undefined ? { message } : { index, message }
  })
}

interface Event {
  id: string
  name: string
  time: number
  payload?: object
}

interface Accepted {
  status: number
  accepted: number
}

const COMPONENT = `${NAMESPACE}.${INGESTION}`
const MAX_EVENTS = 100
const MAX_PAYLOAD = 16 * 1024
const NAME = /^[a-z][a-z0-9]*(\.[a-z][a-z0-9]*)*$/
