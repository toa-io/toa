import type { Input, Output } from '../../io'
import type { Interceptor } from '../../Interception'

export class CORS implements Interceptor {
  public readonly name = 'cors'

  private readonly requestHeaders = new Set<string>([
    'accept',
    'authorization',
    'content-type',
    'etag',
    'if-match',
    'if-none-match'
  ])

  private readonly headers = new Headers({
    'access-control-allow-methods': 'GET, POST, PUT, PATCH, DELETE, LOCK, UNLOCK',
    'access-control-allow-credentials': 'true',
    'access-control-allow-headers': Array.from(this.requestHeaders).join(', '),
    'access-control-max-age': '3600',
    'cache-control': 'max-age=3600',
    vary: 'origin'
  })

  public intercept (input: Input): Output {
    const origin = input.request.headers.origin

    if (origin === undefined)
      return null

    if (input.request.method === 'OPTIONS')
      return this.preflightResponse(origin)

    input.pipelines.response.push((output) => {
      output.headers ??= new Headers()
      output.headers.set('access-control-allow-origin', origin)
      output.headers.set('access-control-allow-credentials', 'true')
      output.headers.set('access-control-expose-headers',
        'authorization, content-type, content-length, etag, last-modified')

      const method = input.request.method

      if (method === 'GET' || method === 'HEAD' || method === 'OPTIONS')
        output.headers.append('vary', 'origin')
    })

    return null
  }

  public allow (header: string): void {
    this.requestHeaders.add(header.toLowerCase())
    this.headers.set('access-control-allow-headers', Array.from(this.requestHeaders).join(', '))
  }

  private preflightResponse (origin: string): Output {
    this.headers.set('access-control-allow-origin', origin)

    return {
      status: 204,
      headers: this.headers
    }
  }
}
