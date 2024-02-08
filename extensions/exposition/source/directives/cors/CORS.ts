import type { OutgoingMessage } from '../../HTTP'
import type { Input, Output } from '../../io'
import type { Family } from '../../Directive'
import type { Interceptor } from '../../Interception'

export class CORS implements Family, Interceptor {
  public readonly name = 'cors'
  public readonly mandatory = true

  private readonly allowedHeaders = new Set<string>(['accept', 'content-type'])
  private allowedHeaderString = Array.from(this.allowedHeaders).join(', ')

  public create (): null {
    return null
  }

  public settle (_: unknown[], input: Input, output: OutgoingMessage): void {
    if (input.headers.origin === undefined)
      return

    output.headers ??= new Headers()
    output.headers.set('access-control-allow-origin', input.headers.origin)
    output.headers.set('access-control-expose-headers',
      'authorization, content-type, content-length, etag')
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
        'access-control-allow-headers': this.allowedHeaderString,
        'access-control-allow-credentials': 'true',
        'access-control-max-age': '86400',
        vary: 'origin'
      })
    }
  }

  public allow (header: string): void {
    this.allowedHeaders.add(header)
    this.allowedHeaderString = Array.from(this.allowedHeaders).join(', ')
  }
}
