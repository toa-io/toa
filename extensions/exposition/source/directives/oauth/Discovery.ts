import { alias, documents, type Documents } from './documents.ts'
import type * as http from '../../HTTP/index.ts'
import type { Input, Output } from '../../io.ts'
import type { Interceptor } from '../../Interception.ts'

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

  /** Hosts that are one resource of their own, by the host itself: an MCP host. */
  private readonly aliases = new Map<string, Documents>()

  public mount(options: http.Options): void {
    this.reset()

    if (options.oauth === undefined) return

    /*
     * `https` always: RFC 8414 has an issuer be one, and OAuth 2.1 has every endpoint of an
     * authorization server be one — the loopback exception is a client's redirect URI, not
     * a server's address. A gateway served without TLS has no authorization server a client
     * may use, and naming it `http` would hide that behind documents none should accept.
     *
     * The host is the configured one, not the request's, which is the client's to write: a
     * forged one would have these documents name someone else's token endpoint.
     */
    const issuers = new Map<string, string>()

    for (const [authority, host] of Object.entries(options.authorities)) {
      const issuer = `https://${host}`

      issuers.set(authority, issuer)
      this.authorities.set(authority, documents(issuer, options.oauth))
    }

    for (const [authority, host] of Object.entries(options.mcp?.hosts ?? {})) {
      const issuer = issuers.get(authority)

      if (issuer === undefined) continue

      this.aliases.set(
        host.toLowerCase(),
        alias(`https://${host.toLowerCase()}`, issuer, options.oauth)
      )
    }
  }

  public reset(): void {
    this.authorities.clear()
    this.aliases.clear()
  }

  public intercept(input: Input): Output {
    // a host of its own is a resource of its own, whatever authority it belongs to
    const known =
      this.aliases.get(input.url.host) ?? this.authorities.get(input.authority)

    if (known === undefined) return null

    // every reply, not just a document's: the challenge is what points a client here
    input.pipelines.response.push((response) => {
      if (response.status !== UNAUTHORIZED) return

      response.headers ??= new Headers()
      response.headers.set('www-authenticate', known.challenge(input.url.pathname))
    })

    const body = known.read(input.url.pathname)

    if (body === undefined) return null

    return { body, headers: new Headers({ 'cache-control': 'public, max-age=3600' }) }
  }
}

const UNAUTHORIZED = 401
