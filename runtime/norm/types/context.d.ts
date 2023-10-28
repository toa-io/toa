import * as _component from './component'
import { Locator } from '@toa.io/core/types'
import type { Declaration } from './context/declaration'

interface Runtime {
  version: string
  registry?: string
  proxy?: string
}

interface Registry {
  base?: string
  platforms?: string[] | null
  build?: {
    arguments?: string[]
    run?: string
  },
  credentials: string
}

interface Composition {
  name: string,
  components: _component.Component[]
}

export interface Dependency<T = undefined> {
  locator: Locator
  manifest: T,
  component: _component.Component
}

interface Context extends Declaration {
  runtime?: Runtime
  environment?: string
  registry?: Registry
  compositions?: Composition[]
  components?: _component.Component[]
  dependencies?: Record<string, Dependency[]>
}

export function context (path: string, environment?: string): Promise<Context>
