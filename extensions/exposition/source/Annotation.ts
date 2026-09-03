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

  /** Failed authentications an address may make; `null` meters none. See `identity.md`. */
  credentials?: Credentials | null
  '/'?: object // parsed and validated by RTD.syntax.parse
}

export interface Credentials {
  /** what an address may fail at once */
  attempts: number

  /** seconds it takes to earn them back */
  interval: number
}
