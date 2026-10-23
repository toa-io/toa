import { current, encode } from 'openspan'
import { Connector, exceptions } from '@toa.io/core'
import { CLIENT, INGEST, NAMESPACE } from '@toa.io/definitions/extensions.chronicles'
import type { Channel } from './Channel.ts'
import type { Message } from './Message.ts'
import type { bindings } from '@toa.io/core/types'

/**
 * What `chronicles.ingest` writes what browsers send through: each event under `client.<name>`,
 * with the client's own id and time, all of a batch together.
 */
export class Client extends Connector {
  public readonly name = 'chronicles'

  private readonly channel: Channel
  private outbound!: bindings.Outbound

  public constructor(channel: Channel) {
    super()

    this.channel = channel
  }

  public async invoke(method: string, ...args: any[]): Promise<unknown> {
    if (method !== 'ingest')
      throw new exceptions.MisuseException(`Chronicles have no '${method}'`)

    return await this.ingest(args[0])
  }

  protected override async open(): Promise<void> {
    this.outbound = await this.channel.open()

    this.depends(this.outbound)
  }

  private async ingest(input: unknown): Promise<Accepted | Error> {
    const events = parse(input)

    if (events instanceof Error) return events

    const context = current()
    const trace = context === undefined ? null : encode(context)

    const messages = events.map((event): Message => ({
      id: event.id,
      label: `${CLIENT}.${event.name}`,
      component: COMPONENT,
      time: event.time,
      entity: null,
      version: null,
      trace,
      payload: event.payload ?? null
    }))

    await Promise.all(
      messages.map(async (message) => await this.channel.send(this.outbound, message))
    )

    return { status: 202, accepted: messages.length }
  }
}

/**
 * A batch, from JSON or from the text `navigator.sendBeacon` sends, which the gateway hands over
 * as a string. Checked here rather than by the operation's schema, which cannot read a string.
 */
function parse(input: unknown): Event[] | Error {
  let events = input

  if (typeof events === 'string')
    try {
      events = JSON.parse(events)
    } catch {
      return invalid('The body is not JSON')
    }

  if (!Array.isArray(events)) return invalid('The body is an array of events')

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

const COMPONENT = `${NAMESPACE}.${INGEST}`
const MAX_EVENTS = 100
const MAX_PAYLOAD = 16 * 1024
const NAME = /^[a-z][a-z0-9]*(\.[a-z][a-z0-9]*)*$/
