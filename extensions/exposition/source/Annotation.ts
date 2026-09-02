import type { Resources } from '@toa.io/operations'
import type { Protocol } from './HTTP'

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
  '/'?: object // parsed and validated by RTD.syntax.parse
}
