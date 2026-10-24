/** The `chronicles` annotation of a context. */
export interface Annotation {
  /** where the log is kept, by the provider that keeps it */
  store: Store

  /** days a row of the log is kept; absent, kept */
  retention?: number

  /** whether the client route is served */
  ingest?: boolean
}

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

  /** the events whose renderings are rows of `events`, `namespace.component.event` */
  events: string[]

  /** the events whose payloads are the states of entities, one per component */
  states: string[]
}

/** The `chronicles` declaration of a component, normalised. */
export interface Declaration {
  /** the labels of the events whose renderings are rows of `events` */
  events: string[]

  /** the label of the event whose payload is the entity as it stands */
  state?: string
}

/** What a component writes: the declaration, the list of its `events`, or nothing. */
export type Declared = Declaration | string[] | null
