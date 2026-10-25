import { Connector, exceptions } from '@toa.io/core'
import { keep } from './address.ts'
import { classify } from './agent.ts'
import type { Encounter } from './Provider.ts'
import type { Address } from '@toa.io/definitions/extensions.chronicles'
import type { Writer } from './Writer.ts'

/**
 * What `chronicles.encounters` writes what clients send through: each event a row of `encounters`,
 * with the client's own id and the visitor and the session the batch names, all of a batch in one
 * write, and answered once it is.
 *
 * A client's clock is its own, and may be off by anything; what it measures between two of its
 * moments is not. So an event is when the gateway received the batch, less how long before
 * sending it the client says it happened: the time of the gateway, at the distance the client
 * measured.
 */
export class Client extends Connector {
  public readonly name = 'chronicles'

  private readonly writer: () => Writer
  private readonly address: () => Address

  public constructor(writer: () => Writer, address: () => Address) {
    super()

    this.writer = writer
    this.address = address
  }

  public async invoke(method: string, ...args: any[]): Promise<unknown> {
    if (method !== 'write')
      throw new exceptions.MisuseException(`Chronicles have no '${method}'`)

    return await this.write(args[0], args[1] ?? null)
  }

  /**
   * `identity` is the one the gateway verified the caller to be, from the path; `null` for the
   * route anyone may call, whose body is then refused where it says whose it is.
   */
  private async write(
    input: unknown,
    identity: string | null
  ): Promise<Accepted | Error> {
    const received = Date.now()
    const batch = parse(input, identity !== null)

    if (batch instanceof Error) return batch

    // put in by the gateway, which overwrites whatever the body says of them
    const { ip, country, origin, agent } = input as Record<string, unknown>
    const address = keep(ip, this.address())
    const from = typeof country === 'string' ? country : null
    const page = typeof origin === 'string' ? origin : null
    const client = typeof agent === 'string' ? agent : null
    const { browser, os, device } = classify(client)

    const encounters = batch.events.map((event): Encounter => ({
      id: event.id,
      name: event.name,
      time: received - (batch.sent - event.time),
      received,
      visitor: batch.visitor,
      session: batch.session,
      identity,
      ip: address,
      country: from,
      origin: page,
      agent: client,
      browser,
      os,
      device,
      payload: event.payload ?? {}
    }))

    await this.writer().write([], [], encounters)

    return { status: 202, accepted: encounters.length }
  }
}

/**
 * A batch, `{ sent, visitor?, session?, events }`: as JSON, or as the form `navigator.sendBeacon`
 * sends, whose `events` is the JSON of them, and `sent` the digits of a number. Checked here rather than by the operation's schema, which
 * cannot read the form's. `identified` is whether the gateway put the identity in, which is then a
 * key the body may have beside `events`.
 */
function parse(input: unknown, identified: boolean): Batch | Error {
  if (typeof input !== 'object' || input === null || Array.isArray(input))
    return invalid('The body is `{ sent, visitor?, session?, events }`')

  // `ip`, `country`, `origin` and `agent` are the gateway's, which sets them on every request it
  // makes
  const {
    events: given,
    sent: stated,
    visitor,
    session,
    identity,
    ip: _ip,
    country: _country,
    origin: _origin,
    agent: _agent,
    ...rest
  } = input as Record<string, unknown>

  const extra = Object.keys(rest)

  if (extra.length > 0) return invalid(`The body has no '${extra[0]}'`)

  // the identity is the path's, never the body's
  if (!identified && identity !== undefined)
    return invalid(
      'The body names no identity: a client that has one sends it in the path'
    )

  for (const [key, value] of [
    ['visitor', visitor],
    ['session', session]
  ] as const)
    if (
      value !== undefined &&
      (typeof value !== 'string' || value === '' || value.length > 64)
    )
      return invalid(`\`${key}\` is a string of 1 to 64 characters`)

  // a form's every value is a string
  const sent =
    typeof stated === 'string' && /^\d{1,15}$/.test(stated) ? Number(stated) : stated

  if (!Number.isInteger(sent) || (sent as number) < 0)
    return invalid(
      '`sent` is when the client sent the batch, in milliseconds by its clock'
    )

  let events = given

  if (typeof events === 'string')
    try {
      events = JSON.parse(events)
    } catch {
      return invalid('`events` is not JSON')
    }

  if (!Array.isArray(events)) return invalid('`events` is an array of events')

  if (events.length > MAX_EVENTS)
    return invalid(`A request carries at most ${MAX_EVENTS} events`)

  for (const [index, event] of events.entries()) {
    const problem = check(event)

    if (problem !== null) return invalid(problem, index)

    if ((event as Event).time > (sent as number))
      return invalid('An event happens before the batch that carries it is sent', index)

    if (JSON.stringify(event.payload ?? {}).length > MAX_PAYLOAD)
      return new Error('OVERSIZED', {
        cause: { index, message: `A payload is at most ${MAX_PAYLOAD} bytes of JSON` }
      })
  }

  return {
    sent: sent as number,
    visitor: (visitor as string | undefined) ?? null,
    session: (session as string | undefined) ?? null,
    events: events as Event[]
  }
}

function check(event: unknown): string | null {
  if (typeof event !== 'object' || event === null || Array.isArray(event))
    return 'An event is an object'

  const { id, name, time, payload, ...rest } = event as Record<string, unknown>

  if (Object.keys(rest).length > 0) return `An event has no '${Object.keys(rest)[0]}'`

  if (typeof id !== 'string' || id.length === 0 || id.length > 64)
    return '`id` is a string of 1 to 64 characters'

  if (typeof name !== 'string' || name.length > 64 || !NAME.test(name))
    return '`name` is lowercase letters, digits and underscores from a letter, at most 64 characters'

  if (!Number.isInteger(time) || (time as number) < 0)
    return "`time` is when it happened, in milliseconds by the client's clock"

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

interface Batch {
  /** when the client sent it, by its clock */
  sent: number
  visitor: string | null
  session: string | null
  events: Event[]
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

const MAX_EVENTS = 100
const MAX_PAYLOAD = 16 * 1024
const NAME = /^[a-z][a-z0-9_]*$/
