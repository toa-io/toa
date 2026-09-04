import type { Resources } from '@toa.io/operations'
import type { Protocol } from './HTTP/index.js'

export interface Annotation {
  authorities: Record<string, string>

  /**
   * `h2c` requires an ingress controller that proxies cleartext HTTP/2 upstream.
   * See `documentation/protocol.md`.
   */
  protocol?: Protocol
  class?: string
  resources?: Resources
  annotations?: Record<string, string>

  /** The Service, as opposed to the Ingress that `annotations` above describes. */
  service?: { annotations?: Record<string, string> }

  debug?: boolean

  /** The header the client address is read from; the connection's without one. See `ip.md`. */
  ip?: string

  /** Failed authentications an address may make; none are metered unless set. See `identity.md`. */
  bouncer?: Bouncer

  /** The authorization server this context exposes; none is exposed without it. */
  oauth?: OAuth
  '/'?: object // parsed and validated by RTD.syntax.parse
}

export interface OAuth {
  /**
   * Where a client sends the user to consent. The one endpoint of the flow that needs a
   * person, and so the one this extension does not serve: an application builds it.
   */
  authorize: string

  /** Paths a token may be restricted to, each advertised as a protected resource. */
  resources?: string[]

  /** What a client may ask for. Each is a role, or a scope within one. */
  scopes?: string[]

  /** Origins whose Client ID Metadata Documents may be read. None are without it. */
  trust?: string[]

  /** Dynamic Client Registration, off unless opened. */
  registration?: 'open' | 'closed'
}

export interface Bouncer {
  /** what an address may fail at once, 20 by default */
  attempts?: number

  /** seconds it takes to earn them back, 60 by default */
  interval?: number
}
