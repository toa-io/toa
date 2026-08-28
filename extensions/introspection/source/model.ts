import type { Source } from '@toa.io/core'

export type { Source }

/**
 * The caller side of an edge: the operation that made the call, the event that
 * caused it, or the service the call came from.
 */
export type Origin = Source

/** The callee side of an edge. */
export interface Target {
  namespace: string
  component: string
  operation: string
}

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
  event: string
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
 * A call observed in a process between flushes. What the application declares —
 * which events exist, and which receiver takes which — is a node's business;
 * an edge is what actually happened.
 *
 * Sent to `introspection.edges`.
 */
export interface Edge {
  src: Origin
  dst: Target
  sample?: Sample
}
