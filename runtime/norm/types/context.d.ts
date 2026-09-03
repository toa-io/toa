import { Manifest } from './component.js'
import { Locator } from '@toa.io/core'
import type { Declaration } from './context/declaration.js'

interface Runtime{
  version: string
  registry?: string
  proxy?: string
}

interface Registry{
  base?: string
  platforms?: string[] | null
  build?: {
    arguments?: string[]
    run?: string
  },
  credentials: string
}

interface Composition{
  name: string,
  components: Manifest[]
  services?: string[]
}

export interface Dependency<T = undefined>{
  locator: Locator
  manifest: T,
  component: Manifest
}

interface Context extends Declaration{
  runtime?: Runtime
  environment?: string
  registry?: Registry
  compositions?: Composition[]
  components?: Manifest[]
  dependencies?: Record<string, Dependency[]>
}

export function context (path: string, environment?: string): Promise<Context>
