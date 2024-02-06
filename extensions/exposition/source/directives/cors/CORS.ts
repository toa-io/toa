import type { OutgoingMessage } from '../../HTTP'
import type { Input, Output } from '../../io'
import type { Family } from '../../Directive'
import type { Interceptor } from '../../Interception'

export class CORS implements Family, Interceptor {
  public readonly name = 'cors'
  public readonly mandatory = true

  private readonly exposed = new Set<string>([
    'authorization',
    'content-type',
    'content-length',
    'etag'
  ])

  private readonly exposeHeaders = Array.from(this.exposed).join(', ')

  public create (): null {
    console.log('CORS created!')

    return null
  }

  public preflight (_: unknown[], input: Input): Output {
    console.log('CORS preflighted!')

    return null
  }

  public settle (_: unknown[], input: Input, output: OutgoingMessage): void {
    if (input.headers.origin === undefined)
      return

    output.headers ??= new Headers()
    output.headers.set('access-control-allow-origin', input.headers.origin)
    output.headers.set('access-control-expose-headers', this.exposeHeaders)
    output.headers.append('vary', 'origin')
  }

  public intercept (input: Input): Output {
    if (input.method !== 'OPTIONS' || input.headers.origin === undefined)
      return null

    return {
      status: 204,
      headers: new Headers({
        'access-control-allow-origin': input.headers.origin,
        'access-control-allow-methods': 'GET, POST, PUT, PATCH, DELETE',
        'access-control-allow-headers': 'accept, authorization, content-type',
        'access-control-allow-credentials': 'true',
        'access-control-max-age': '86400',
        vary: 'origin'
      })
    }
  }
}
