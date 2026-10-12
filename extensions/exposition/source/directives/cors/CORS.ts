import type { Input, Output } from '../../io.ts'
import type { Interceptor } from '../../Interception.ts'

/**
 * Everything a request to the same URL may ask for later, so one preflight covers them all.
 * Wildcards hold for a request sent without credentials, and there are no cookies to send;
 * `authorization` is the one header `*` does not stand for. The origin is allowed by the
 * server, on every reply it writes.
 */
const PERMISSIONS: Array<[string, string]> = [
  [
    'access-control-allow-methods',
    'GET, POST, PUT, PATCH, DELETE, LOCK, UNLOCK, OPTIONS'
  ],
  ['access-control-allow-headers', '*, authorization'],
  // a browser cuts it to its own limit, and this is the longest any of them keeps
  ['access-control-max-age', '86400']
]

export class CORS implements Interceptor {
  public readonly name = 'cors'

  public intercept(input: Input): Output {
    /*
     * A preflight is `OPTIONS` carrying `Access-Control-Request-Method`, and only that. A
     * browser puts `Origin` on every request whose method is not `GET` or `HEAD` — its own
     * `OPTIONS` included, same-origin or not — so answering that one here would put
     * introspection out of reach of any page.
     */
    if (
      input.request.method !== 'OPTIONS' ||
      input.request.headers.origin === undefined ||
      input.request.headers['access-control-request-method'] === undefined
    )
      return null

    // the reply is handed to whatever shapes it, so each one is its own
    return { status: 204, headers: new Headers(PERMISSIONS) }
  }
}
