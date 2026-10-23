/** The `chronicles` annotation of a context, as it is written. */
export interface Annotation {
  /** the broker components publish to and ClickHouse consumes from */
  broker: string

  /** its HTTP address, whose path names the database; or that and the broker as it sees it */
  clickhouse: string | { url: string; broker?: string }

  /** days a row of the log is kept; absent, kept */
  retention?: number

  /** whether the client route is served */
  ingest?: boolean
}

/** What the service is given of the annotation, its credentials aside. */
export interface Settings {
  clickhouse: {
    url: string

    /** the broker as ClickHouse reaches it */
    broker: string
  }

  retention?: number

  ingest: boolean
}

/** The `chronicles` declaration of a component: the labels of the events that carry its changes. */
export type Declaration = string[]

/** What a component writes, before it is normalised. */
export type Declared = Declaration | null
