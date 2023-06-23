import { Composition, Registry, Runtime } from '../context'

interface Composition {
  name: string,
  components: string[]
}

export interface Declaration {
  name: string
  description?: string
  version?: string
  runtime?: Runtime | string
  registry?: Registry | string
  packages?: string
  compositions?: Composition[]
  annotations?: Record<string, object>
}
