import { documents, type Documents } from './documents.js'
import type * as http from '../../HTTP/index.js'
import type { Input, Output } from '../../io.js'
import type { Interceptor } from '../../Interception.js'

/**
 * What a client reads before it can authenticate: where the authorization server is, and
 * what this resource expects. Both are fixed paths a specification names, both must be
 * answered to anyone, and both are a function of the annotation alone — nothing is read to
 * build them, so they are built once per authority and served as they are.
 *
 * An interceptor rather than a route because `auth` runs before any directive: a client
 * re-reading discovery while holding a stale token would have it verified, and then be
 * refused a document that has to be public.
 */
export class Discovery implements Interceptor {
  private authorities: Record<string, Documents> = {}

  public mount (options: http.Options): void {
    this.authorities = {}

    if (options.oauth === undefined)
      return

    for (const [authority, host] of Object.entries(options.authorities))
      this.authorities[authority] = documents(origin(host), options.oauth)
  }

  public reset (): void {
    this.authorities = {}
  }

  public intercept (input: Input): Output {
    const known = this.authorities[input.authority]

    if (known === undefined)
      return null

    // every reply, not just a document's: the challenge is what points a client here
    input.pipelines.response.push((response) => {
      if (response.status !== UNAUTHORIZED)
        return

      response.headers ??= new Headers()
      response.headers.set('www-authenticate', known.challenge(input.url.pathname))
    })

    const body = known.read(input.url.pathname)

    if (body === undefined)
      return null

    return { body, headers: new Headers({ 'cache-control': 'public, max-age=3600' }) }
  }
}

/**
 * The absolute URL an authority is reached at. Loopback is served over http and everything
 * else over https: the gateway may sit behind a terminating proxy, so the connection does
 * not say which, and the configured host does. Taken from the configuration rather than
 * from the request's `host`, which is the client's to write.
 */
function origin (host: string): string {
  const name = host.split(':')[0]

  const loopback = name === 'localhost' || name === '127.0.0.1' || name === '[::1]' ||
    name.endsWith('.localhost')

  return `${loopback ? 'http' : 'https'}://${host}`
}

const UNAUTHORIZED = 401
