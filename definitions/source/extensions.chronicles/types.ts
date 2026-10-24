/** The `chronicles` annotation of a context. */
export interface Annotation {
  /** where the log is kept, by the provider that keeps it */
  store: Store

  /** days a row of the log is kept; absent, kept */
  retention?: number

  /** whether the client route is served */
  ingest?: boolean

  /** how much of a browser's address the log keeps; `truncated` unless it says `full` */
  ip?: Address
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

  ingest: boolean

  ip: Address

  /** the events whose renderings are rows of `events`, `namespace.component.event` */
  events: string[]

  /** the events whose payloads are the states of entities, one per component */
  states: string[]

  /** the property of its payloads that names the identity a row is of, by component */
  identities: Record<string, string>
}

/** The `chronicles` declaration of a component, normalised. */
export interface Declaration {
  /** the labels of the events whose renderings are rows of `events` */
  events: string[]

  /** the label of the event whose payload is the entity as it stands */
  state?: string

  /** the property of the payloads that names the identity a row is of; `null` where none does */
  identity: string | null
}

/** What a component writes: the declaration, the list of its `events`, or nothing. */
export type Declared =
  | (Omit<Declaration, 'identity'> & { identity?: string | null })
  | string[]
  | null
