import { Readable } from 'node:stream'
import { Hub } from './Hub.ts'
import type { Stream } from './Stream.ts'
import type { Context, OutgoingMessage } from '../../HTTP/index.ts'
import type { DirectiveFamily, Parameter } from '../../RTD/index.ts'
import type { Output } from '../../io.ts'

/**
 * `realtime:stream` answers with the stream of the key a route variable names. On a method that
 * calls an endpoint, the stream is opened once the call has succeeded, and is the reply instead
 * of what the call answered; one that fails is answered as it is, and opens nothing.
 *
 * Who may read the stream is what the route's own directives say, as for anything else it serves.
 */
export class Realtime implements DirectiveFamily<Directive> {
  public readonly name = 'realtime'
  public readonly mandatory = false

  private readonly hub = new Hub()

  // the key of a call that opens its stream once it has succeeded, from before the call
  private readonly pending = new WeakMap<Context, string>()

  // the arguments every family is given a directive with
  // eslint-disable-next-line max-params
  public create(
    name: string,
    value: unknown,
    _remotes: unknown,
    route: string,
    called: boolean = false
  ): Directive {
    if (name !== 'stream')
      throw new Error(`Directive 'realtime:${name}' is not implemented`)

    if (typeof value !== 'string' || !route.includes(`:${value}`))
      throw new Error(
        `'realtime:stream' names the route variable that is the key, and '${String(value)}' ` +
          `is not one of '${route}'`
      )

    return { variable: value, called }
  }

  public async precall(
    directives: Directive[],
    context: Context,
    parameters: Parameter[]
  ): Promise<Output> {
    const directive = directives[0]
    const key = parameters.find(({ name }) => name === directive.variable)?.value

    if (key === undefined)
      throw new Error(`Route variable '${directive.variable}' is not found`)

    if (!directive.called) return { body: await this.open(key, context) }

    this.pending.set(context, key)

    return null
  }

  public async settle(
    _: Directive[],
    context: Context,
    response: OutgoingMessage
  ): Promise<void> {
    const key = this.pending.get(context)

    if (key === undefined) return

    this.pending.delete(context)

    // a call that failed answers with what it failed with
    if (response.status !== undefined && response.status >= 300) return

    if (response.body instanceof Error) return

    if (response.body instanceof Readable) response.body.destroy()

    response.status = 200
    response.body = await this.open(key, context)
  }

  public dispose(): void {
    this.hub.close()
  }

  private async open(key: string, context: Context): Promise<Stream> {
    const token = context.url.searchParams.get('token') ?? undefined

    return await this.hub.open(key, token)
  }
}

export interface Directive {
  variable: string
  called: boolean
}
