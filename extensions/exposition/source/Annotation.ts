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

  /** Failed authentications an address may make; none are metered unless set. See `identity.md`. */
  authentication?: Authentication
  '/'?: object // parsed and validated by RTD.syntax.parse
}

export interface Authentication {
  /** the header the client address is read from, the one the edge in front sets */
  header: string

  /** what an address may fail at once, 20 by default */
  attempts?: number

  /** seconds it takes to earn them back, 60 by default */
  interval?: number
}
