import { Composition, Registry, Runtime } from '../context'

interface Composition {
  name: string,
  components: string[]
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
  mono?: Mono
  ingress?: Ingress
  annotations?: Record<string, object>
}
