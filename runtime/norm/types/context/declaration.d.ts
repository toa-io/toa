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

export interface Declaration {
  name: string
  description?: string
  version?: string
  runtime?: Runtime | string
  registry?: Registry | string
  compositions?: Composition[]
  mono?: Mono
  annotations?: Record<string, object>
}
