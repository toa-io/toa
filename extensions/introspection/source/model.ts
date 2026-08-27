import type { Source } from '@toa.io/core'

export type { Source }

/**
 * The caller side of an edge. A publish has no operation: the emitting
 * component itself is the origin.
 */
export type Origin = Source | { namespace: string, component: string }

/** The callee side of an edge. */
export interface Target {
  namespace: string
  component: string
  operation?: string
  event?: string
}

export type Kind = 'call' | 'event' | 'publish'

export interface Operation {
  endpoint: string
  type: string
  scope?: string
  query?: boolean
  input?: object | null
  output?: object | null
  errors?: string[]
}

export interface Event {
  label: string
  binding?: string
}

export interface Receiver {
  label: string
  source: string
  operation: string
  conditioned: boolean
  adaptive: boolean
}

export interface Entity {
  schema: object
  storage?: string
  associated: boolean
}

/**
 * The static description of a component, derived from its manifest.
 * Sent to `introspection.nodes`.
 */
export interface Node {
  namespace: string
  component: string
  version: string
  entity: Entity | null
  operations: Operation[]
  events: Event[]
  receivers: Receiver[]
  extensions: string[]
}

export interface Sample {
  at: number
  input?: unknown
  outcome: Outcome
}

export type Outcome = 'ok' | 'error' | 'exception'

/**
 * A connection observed in a process between flushes.
 * Sent to `introspection.edges`.
 */
export interface Edge {
  kind: Kind
  src: Origin
  dst: Target
  sample?: Sample
}
