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

  /** the events the log is kept of, `namespace.component.event` */
  events: string[]
}

/** The `chronicles` declaration of a component: the labels of the events that carry its changes. */
export type Declaration = string[]

/** What a component writes, before it is normalised. */
export type Declared = Declaration | null
