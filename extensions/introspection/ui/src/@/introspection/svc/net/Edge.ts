/** A call one component made to another, as it actually happened. */
export interface Edge {
  id: string
  src: Origin
  dst: Target
  sample?: Sample
  _created: number
  _updated: number
  _version: number
  _deleted?: number | null
}

/** What caused the call: another operation, an event, or a service outside the map. */
export type Origin =
  | { namespace: string; component: string; operation: string }
  | { namespace: string; component: string; event: string }
  | { service: string }

export interface Target {
  namespace: string
  component: string
  operation: string
}

export interface Sample {
  at: number
  input?: unknown
  outcome: Outcome
}

export type Outcome = 'ok' | 'error' | 'exception'
