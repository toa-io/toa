import { NotFound } from '../../HTTP/index.ts'
import { configured } from '../../realtime/redis.ts'
import { Hub } from './Hub.ts'
import type { Context } from '../../HTTP/index.ts'
import type { DirectiveFamily, Parameter } from '../../RTD/index.ts'
import type { Output } from '../../io.ts'

/**
 * `realtime:stream` answers with the stream of the key a route variable names. Who may read it is
 * what the route's own directives say, as for anything else it serves.
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

    if (typeof value !== 'string' || !route.includes(`:${value}`))
      throw new Error(
        `'realtime:stream' names the route variable that is the key, and '${String(value)}' ` +
          `is not one of '${route}'`
      )

    return { variable: value }
  }

  public async precall(
    directives: Directive[],
    context: Context,
    parameters: Parameter[]
  ): Promise<Output> {
    const [directive] = directives
    const key = parameters.find(({ name }) => name === directive.variable)?.value

    if (key === undefined)
      throw new Error(`Route variable '${directive.variable}' is not found`)

    // nothing in the context declares realtime, so nothing is kept to be read
    if (!configured()) throw new NotFound('Realtime streams are not configured')

    const token = context.url.searchParams.get('token') ?? undefined

    return { body: await this.hub.open(key, token) }
  }

  public dispose(): void {
    this.hub.close()
  }
}

export interface Directive {
  variable: string
}
