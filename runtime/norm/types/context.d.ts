import { Manifest } from './component.d.ts'
import { Locator } from '@toa.io/core'
import type { Declaration } from './context/declaration.d.ts'

interface Runtime {
  version: string
  registry?: string
  proxy?: string
}

interface Registry {
  base?: string
  platforms?: string[] | null
  services?: 'build' | 'published'
  build?: {
    arguments?: string[]
    run?: string
  }
  credentials: string
}

interface Composition {
  name: string
  components: Manifest[]
  services?: string[]
  replicas?: number
  /** what a deploy installs for the services this composition runs, by package name */
  packages?: Record<string, string>
}

export interface Dependency<T = undefined> {
  locator: Locator
  manifest: T
  component: Manifest
}

interface Context extends Declaration {
  runtime?: Runtime
  environment?: string
  registry?: Registry
  compositions?: Composition[]
  components?: Manifest[]
  dependencies?: Record<string, Dependency[]>
  /** what a deploy installs for every service, which is what `mono` runs */
  packages?: Record<string, string>
}

export function context(
  path: string,
  environment?: string,
  options?: {
    /** `false` does not apply eviction: every component is treated as deployed */
    evicted?: boolean
  }
): Promise<Context>
