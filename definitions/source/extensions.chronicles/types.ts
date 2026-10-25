import type { Resources } from '@toa.io/operations'

/** The `chronicles` annotation of a context. */
export interface Annotation {
  /** where the log is kept, by the provider that keeps it */
  store: Store

  /** days a row of `events` and of `encounters` is kept; absent, kept */
  retention?: number

  /** whether the routes clients send encounters to are served */
  encounters?: boolean

  /** how much of a client's address the log keeps; `truncated` unless it says `full` */
  ip?: Address

  /** what the service may take; `null`, which the schema admits, deploys it without any */
  resources?: Resources
}

export type Address = 'truncated' | 'full'

export interface Store {
  provider: 'clickhouse'

  /** the provider's own address of it */
  url: string
}

/** What the service is given of the annotation, its credentials aside. */
export interface Settings {
  store: Store
  retention?: number
  encounters: boolean
  ip: Address

  /** the contracts of the events whose renderings are rows of `events`, by label */
  events: Record<string, Contract>

  /** the contracts of the events whose payloads are the states of entities, one per component */
  states: Record<string, Contract>

  /** the contracts of the facts the components send, by label */
  facts: Record<string, Contract>

  /** the property of its payloads that names the identity a row is of, by component */
  identities: Record<string, string>

  /**
   * the property of its payloads that says when a change was made, by component; `null` where
   * the time a message carries is when, always
   */
  timestamps: Record<string, string | null>
}

/** What a label of the log means, and what of its payload is written. */
export interface Contract {
  description: string
  properties: Record<string, Property>
}

/**
 * A property of a payload, as JSON Schema of the types the log has: every one described, and
 * nothing a store could not read as a type of its own.
 */
export interface Property {
  type: 'string' | 'integer' | 'number' | 'boolean' | 'object' | 'array'
  description?: string
  enum?: string[]
  format?: string
  properties?: Record<string, Property>
  items?: Property
}

/** The `chronicles` declaration of a component, normalised. */
export interface Declaration {
  /** the contracts of the events whose renderings are rows of `events`, by event */
  events: Record<string, Contract>

  /** the contract of the event whose payload is the entity as it stands, and which event it is */
  state?: State

  /** the contracts of the facts the component sends, by name */
  facts: Record<string, Contract>

  /** the property of the payloads that names the identity a row is of; `null` where none does */
  identity: string | null

  /** the property of the payloads that says when the change was made; `null` where none does */
  timestamp: string | null
}

export interface State extends Contract {
  event: string
}

/** What a component writes: the declaration, or nothing. */
export type Declared =
  | (Partial<Omit<Declaration, 'identity' | 'timestamp'>> & {
      identity?: string | null
      timestamp?: string | null
    })
  | null
