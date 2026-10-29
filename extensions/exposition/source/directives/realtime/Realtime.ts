import * as schemas from '@toa.io/schemas'
import { literal } from '@toa.io/definitions/extensions.exposition/realtime'
import { BadRequest, NotFound, RequestEntityTooLarge } from '../../HTTP/index.ts'
import { configured } from '../../realtime/redis.ts'
import { Hub } from './Hub.ts'
import type { Schema } from '@toa.io/schemas'
import type { Context } from '../../HTTP/index.ts'
import type { DirectiveFamily, Parameter } from '../../RTD/index.ts'
import type { Output } from '../../io.ts'
import type { Context as Authenticated } from '../auth/types.ts'

/**
 * `realtime:stream` answers with the stream of the key a route variable names, or of a literal
 * key, and `realtime:push` sends the request body to whoever reads one. Who may read or push is
 * what the route's own directives say, as for anything else it serves.
 */
export class Realtime implements DirectiveFamily<Directive> {
  public readonly name = 'realtime'
  public readonly mandatory = false

  private readonly hub = new Hub()

  // the arguments every family is given a directive with
  // eslint-disable-next-line max-params
  public create(name: string, value: unknown, _: unknown, route: string): Directive {
    if (name === 'stream') return key(name, value, route)

    if (name === 'push') return push(value, route)

    throw new Error(`Directive 'realtime:${name}' is not implemented`)
  }

  /** A method answers with a stream or pushes to one, and not both. */
  public arrange(directives: Directive[]): void {
    if (directives.length > 1)
      throw new Error('A method declares one realtime directive, and no more')
  }

  public async precall(
    directives: Directive[],
    context: Context,
    parameters: Parameter[]
  ): Promise<Output> {
    const [directive] = directives
    const key = 'key' in directive ? directive.key : this.variable(directive, parameters)

    // nothing in the context declares realtime, so nothing is kept to be read
    if (!configured()) throw new NotFound('Realtime streams are not configured')

    if ('push' in directive)
      return await this.push(directive.push, key, context as Authenticated)

    const token = context.url.searchParams.get('token') ?? undefined

    return { body: await this.hub.open(key, token) }
  }

  public dispose(): void {
    this.hub.close()
  }

  /** The value of the route variable, which is never a literal: a literal is served by name. */
  private variable({ variable }: Variable, parameters: Parameter[]): string {
    const key = parameters.find(({ name }) => name === variable)?.value

    if (key === undefined) throw new Error(`Route variable '${variable}' is not found`)

    if (literal(key)) throw new NotFound()

    return key
  }

  private async push(
    { event, input }: Push['push'],
    key: string,
    context: Authenticated
  ): Promise<Output> {
    const length = Number(context.request.headers['content-length'])

    // what is pushed is sent to every reader of the key, so how much may be is bounded
    if (length > LIMIT) throw new RequestEntityTooLarge(`Size limit is ${LIMIT} bytes`)

    const body = await context.body()

    // a body sent without its length is measured once it is read
    if (Number.isNaN(length) && Buffer.byteLength(JSON.stringify(body) ?? '') > LIMIT)
      throw new RequestEntityTooLarge(`Size limit is ${LIMIT} bytes`)

    const error = input.fit(body)

    if (error !== null) throw new BadRequest(error.message)

    await this.hub.push(key, { event, sender: context.identity?.id, data: body })

    return { status: 204 }
  }
}

/** The key a directive names: a route variable, or a literal. */
function key(name: string, value: unknown, route: string): Variable | Literal {
  if (typeof value === 'string' && literal(value)) {
    if (value.length === 1)
      throw new Error(`'realtime:${name}' literal '${value}' names no key, at '${route}'`)

    return { key: value }
  }

  if (typeof value !== 'string' || !route.includes(`:${value}`))
    throw new Error(
      `'realtime:${name}' names the route variable that is the key, or a literal key, and ` +
        `'${String(value)}' is not one of '${route}'`
    )

  return { variable: value }
}

function push(value: unknown, route: string): Push {
  const { key: name, event, input } = (value ?? {}) as Record<string, unknown>

  if (typeof event !== 'string' || event === '')
    throw new Error(`'realtime:push' names the event it is streamed as, at '${route}'`)

  // a reader tells a token by its name, and a routed event by a name qualified by its component
  if (event === 'token' || event.includes('.'))
    throw new Error(
      `'realtime:push' event '${event}' would be read as a token or a routed event, at '${route}'`
    )

  // whatever is pushed reaches every reader of the key, so what may be is stated
  if (typeof input !== 'object' || input === null || Array.isArray(input))
    throw new Error(`'realtime:push' states the schema of what is pushed, at '${route}'`)

  return { ...key('push', name, route), push: { event, input: schemas.schema(input) } }
}

/** Bytes a pushed body may take. */
const LIMIT = 65536

export type Directive = Variable | Literal | Push

interface Variable {
  variable: string
}

interface Literal {
  key: string
}

type Push = (Variable | Literal) & {
  push: {
    event: string
    input: Schema
  }
}
