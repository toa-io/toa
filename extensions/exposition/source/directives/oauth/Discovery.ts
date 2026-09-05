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
  /**
   * A map, because the key is the request's authority and an unconfigured host is passed
   * through as itself: `Host: constructor` names something a plain object answers on its own.
   */
  private readonly authorities = new Map<string, Documents>()

  public mount (options: http.Options): void {
    this.authorities.clear()

    if (options.oauth === undefined)
      return

    /*
     * `https` always: RFC 8414 has an issuer be one, and OAuth 2.1 has every endpoint of an
     * authorization server be one — the loopback exception is a client's redirect URI, not
     * a server's address. A gateway served without TLS has no authorization server a client
     * may use, and naming it `http` would hide that behind documents none should accept.
     *
     * The host is the configured one, not the request's, which is the client's to write: a
     * forged one would have these documents name someone else's token endpoint.
     */
    for (const [authority, host] of Object.entries(options.authorities))
      this.authorities.set(authority, documents(`https://${host}`, options.oauth))
  }

  public reset (): void {
    this.authorities.clear()
  }

  public intercept (input: Input): Output {
    const known = this.authorities.get(input.authority)

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

const UNAUTHORIZED = 401
