import type { Manifest } from '@toa.io/norm'
import type { Locator } from '@toa.io/core'

export interface Service {
  group: string
  name: string
  version: string
  port?: number
  ingress?: Ingress
  resources?: Resources
  variables?: Variable[]
  components?: string[]
  probe?: Probe | false
}

export interface Variable {
  name: string
  value?: string
  secret?: {
    name: string
    key: string
    optional?: boolean
  }
}

export interface Instance<T> {
  locator: Locator
  manifest: T
  component: Manifest
}

export type Instances<T> = Array<Instance<T>>

export type Variables = Record<'global' | string, Variable[]>
export type Mounts = Record<'global' | string, Mount[]>

export interface Dependency {
  services?: Service[]
  variables?: Variables
  mounts?: Mounts
  /** Default probe for compositions and services without their own probe. `false` disables. */
  probe?: Probe | false
}

interface Ingress {
  default?: boolean
  hosts?: string[]
  class?: string
  annotations?: object
}

export interface Probe {
  port: number
  path: string
  delay?: number
}

interface Mount {
  name: string
  path: string
  claim: string
}

export interface Resources {
  cpu: string[]
  memory: string[]
}
