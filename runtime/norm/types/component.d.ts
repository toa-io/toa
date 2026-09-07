import type { Locator } from '@toa.io/core'
import type { operations } from '@toa.io/core/types'

type Map = {
  [id: string]: Component
}

export type Operation = {
  type: operations.type
  scope?: operations.scope
  bindings?: string[]
  description?: string
  input?: any
  output?: any
  error?: any
  query?: boolean
}

export type Operations = Record<string, Operation>

type Event = {
  binding: string
}

type Events = {
  [key: string]: Event
}

type Receiver = {
  operation: string
  adaptive: boolean
  conditioned: boolean
  bridge: string
  binding: string
  path: string
  source?: string
}

type Migration = {
  id: string
  steps: unknown[]
  /** the prototype it is inherited from; absent on the component's own */
  prototype?: string
}

export type Entity = {
  properties: Record<string, Object>
  required?: string[]
  /** what a record holds before anything is written to it */
  blank?: Record<string, unknown>
  storage?: string
  associated?: boolean
  custom?: boolean
  migrations?: Migration[]
}

type Declaration = {
  prototype?: string
  namespace: string
  name: string
  version: string
  entity?: Entity
  bindings?: string[]
  operations: Operations
  events?: Events
  receivers?: Record<string, Receiver>
  extensions?: Record<string, object>
  properties?: Record<string, object>
}

export type Manifest = Declaration & {
  locator: Locator
  path: string
  /** what a deploy installs beside this component for what it declares, by package name */
  packages?: Record<string, string>
}
