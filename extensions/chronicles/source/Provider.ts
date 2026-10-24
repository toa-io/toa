/**
 * Where the log is kept. A provider holds the log's two tables — `events`, a row for everything
 * that happened, and `states`, each entity as it stands — and reads them in a dialect of its own,
 * which is what an agent writes its queries in.
 */
export interface Provider {
  /** what a query is written in, which `describe` tells whoever writes one */
  readonly dialect: string

  /** the names a view cannot take: the provider's own tables */
  readonly tables: string[]

  /** the tables, and the reader queries run as, made what the settings say */
  provision(): Promise<void>

  /**
   * Rows of `events`, written once however often a row of one `id` is written; and states, each
   * kept where it is of a higher version than the one there.
   */
  write(rows: Row[], states: State[]): Promise<void>

  /** the labels, with their counts, their times and the fields of their payloads */
  labels(): Promise<Label[]>

  /** the components with a state, with how many entities each has and the fields of the state */
  states(): Promise<Summary[]>

  /** a statement of the dialect, run as a reader that can read the log and nothing else */
  query(sql: string): Promise<Result>

  /** refuses what a view could not be: anything but one statement a query could run */
  validate(sql: string): Promise<void>

  views(): Promise<View[]>

  /** a view of `name`, replacing one there is; with `refresh`, recomputed on that cycle */
  define(name: string, sql: string, refresh?: number): Promise<void>

  drop(name: string): Promise<void>
}

/** A row of the log. */
export interface Row {
  /** the same however many times it is delivered */
  id: string

  /** `<component>.<event>`, `<component>.<name>` for a fact, `client.<name>` for a browser */
  label: string

  /** the component it is of */
  component: string

  /** when it happened, in milliseconds */
  time: number

  /** the id of the record that changed, where the payload carries one */
  entity: string | null

  /** its `VERSION`, likewise */
  version: number | null

  /** the identity it is of, where something says so */
  identity: string | null

  /** the W3C traceparent of the call that caused it */
  trace: string | null

  payload: object
}

/** An entity as it stands, as the event a component names its `state` renders it. */
export interface State {
  component: string
  entity: string
  version: number
  identity: string | null
  time: number
  payload: object
}

export interface Summary {
  component: string
  entities: number
  paths: string[]
}

export interface Label {
  label: string
  rows: number
  first: string
  last: string
  paths: string[]
}

export interface View {
  name: string
  sql: string

  /** seconds between computations of a view that is a table */
  refresh?: number
}

export interface Result {
  columns: Array<{ name: string; type: string }>
  rows: unknown[][]
  truncated: boolean
}

/** What a provider refused a statement with, in its own words. */
export class Refusal extends Error {}
