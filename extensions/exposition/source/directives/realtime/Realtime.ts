import { literal } from '@toa.io/definitions/extensions.exposition/realtime'
import { NotFound } from '../../HTTP/index.ts'
import { configured } from '../../realtime/redis.ts'
import { Hub } from './Hub.ts'
import type { Context } from '../../HTTP/index.ts'
import type { DirectiveFamily, Parameter } from '../../RTD/index.ts'
import type { Output } from '../../io.ts'

/**
 * `realtime:stream` answers with the stream of the key a route variable names, or of a literal
 * key. Who may read it is what the route's own directives say, as for anything else it serves.
 */
export class Realtime implements DirectiveFamily<Directive> {
  public readonly name = 'realtime'
  public readonly mandatory = false

  private readonly hub = new Hub()

  // the arguments every family is given a directive with
  // eslint-disable-next-line max-params
  public create(name: string, value: unknown, _: unknown, route: string): Directive {
    if (name !== 'stream')
      throw new Error(`Directive 'realtime:${name}' is not implemented`)

    if (typeof value === 'string' && literal(value)) {
      if (value.length === 1)
        throw new Error(
          `'realtime:stream' literal '${value}' names no key, at '${route}'`
        )

      return { key: value }
    }

    if (typeof value !== 'string' || !route.includes(`:${value}`))
      throw new Error(
        `'realtime:stream' names the route variable that is the key, or a literal key, and ` +
          `'${String(value)}' is not one of '${route}'`
      )

    return { variable: value }
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
}

export type Directive = Variable | Literal

interface Variable {
  variable: string
}

interface Literal {
  key: string
}
