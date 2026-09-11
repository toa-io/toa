import { Registry, Runtime } from '../context.js'

/** A composition as declared, before its members are resolved. */
interface Composition {
  name: string
  components: string[]
  services?: string[]
}

/** What Toa does not deploy for a context, whatever else names it: still part of it, deployed by other means. */
export interface Evicted {
  components?: string[]
  services?: string[]
}

export interface Resources {
  cpu?: [string, string]
  memory?: [string, string]
}

export interface Mono {
  replicas?: number
  resources?: Resources
}

/**
 * Cluster-level ingress configuration, applied to every service that declares one.
 */
export interface Ingress {
  hosts?: string[]
  class?: string
  annotations?: Record<string, string>
  default?: boolean
}

export interface Declaration {
  name: string
  description?: string
  version?: string
  runtime?: Runtime | string
  registry?: Registry | string
  compositions?: Composition[]
  evicted?: Evicted
  mono?: Mono
  ingress?: Ingress
  annotations?: Record<string, object>
}
