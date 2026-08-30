import type { Input, Output } from '../../io'
import type { Interceptor } from '../../Interception'

/** What is allowed before any directive asks for more. */
const REQUEST_HEADERS = [
  'accept',
  'authorization',
  'content-type',
  'if-match',
  'if-none-match'
]

export class CORS implements Interceptor {
  public readonly name = 'cors'

  private requestHeaders = new Set<string>(REQUEST_HEADERS)

  private readonly headers = new Headers({
    'access-control-allow-methods': 'GET, POST, PUT, PATCH, DELETE, LOCK, UNLOCK',
    'access-control-allow-credentials': 'true',
    'access-control-allow-headers': this.allowedHeaders(),
    'access-control-max-age': '3600',
    'cache-control': 'max-age=3600',
    vary: 'origin'
  })

  public intercept (input: Input): Output {
    const origin = input.request.headers.origin

    if (origin !== undefined && input.request.method === 'OPTIONS')
      return this.preflightResponse(origin)

    input.pipelines.response.push((output) => {
      output.headers ??= new Headers()

      if (origin !== undefined) {
        output.headers.set('access-control-allow-origin', origin)
        output.headers.set('access-control-allow-credentials', 'true')
        output.headers.set('access-control-expose-headers',
          'authorization, content-type, content-length, date, etag, last-modified')
      }

      const method = input.request.method

      if (method === 'GET' || method === 'HEAD' || method === 'OPTIONS')
        output.headers.append('vary', 'origin')
    })

    return null
  }

  public reset (): void {
    this.requestHeaders = new Set(REQUEST_HEADERS)
    this.headers.set('access-control-allow-headers', this.allowedHeaders())
  }

  public allow (header: string): void {
    this.requestHeaders.add(header.toLowerCase())
    this.headers.set('access-control-allow-headers', this.allowedHeaders())
  }

  /**
   * Sorted, because the set is filled as branches merge and their order is not
   * fixed — an unsorted value would differ between otherwise identical processes,
   * and between one restart and the next.
   */
  private allowedHeaders (): string {
    return Array.from(this.requestHeaders).sort().join(', ')
  }

  private preflightResponse (origin: string): Output {
    this.headers.set('access-control-allow-origin', origin)

    return {
      status: 204,
      headers: this.headers
    }
  }
}
