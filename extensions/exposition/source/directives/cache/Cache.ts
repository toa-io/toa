import { Control } from './Control.js'
import { Exact } from './Exact.js'
import type { Output } from '../../io.js'
import type { AuthenticatedContext, Directive } from './types.js'
import type { DirectiveFamily } from '../../RTD/index.js'
import type * as http from '../../HTTP/index.js'

export class Cache implements DirectiveFamily<Directive> {
  public readonly name: string = 'cache'
  public readonly mandatory: boolean = true

  public create (name: string, value: any): Directive {
    const Class = constructors[name]

    if (Class === undefined)
      throw new Error(`Directive 'cache:${name}' is not implemented`)

    return new Class(value)
  }

  public preflight (): Output {
    return null
  }

  public async settle (directives: Directive[], context: AuthenticatedContext, response: http.OutgoingMessage): Promise<void> {
    const directive = directives[0]

    response.headers ??= new Headers()

    // `cache:exact` sets what it is given, whatever the method: whether a reply may be
    // stored at all is not a question about the method's cacheability, and a token
    // endpoint answers a POST it must not have kept
    if (directive instanceof Exact) {
      directive.set(context, response.headers)

      return
    }

    const method = context.request.method

    if (method !== 'GET' && method !== 'HEAD')
      return

    if (directive === undefined) {
      if (context.identity !== null && !Control.disabled(response.headers)) {
        response.headers.set('cache-control', 'private')
        response.headers.append('vary', 'authorization')
      }
    } else
      directive.set(context, response.headers)
  }
}

const constructors: Record<string, new (value: any) => Directive> = {
  control: Control,
  exact: Exact
}
