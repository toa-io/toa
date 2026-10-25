import type { Property } from '@toa.io/definitions/extensions.chronicles'

/**
 * Where the log is read. A provider reads the log's tables — `events`, a row for everything a
 * component did, `states`, each entity as it stands, and `encounters`, what clients sent — in a
 * dialect of its own, which is what an agent writes its queries in. What it reads is what the store
 * lets the context's user read; it creates nothing there but the views it is asked to.
 */
export interface Provider {
  /** how the store is read: its dialect and what is particular to it, for whoever writes a query */
  readonly guide: string

  /** the names a view cannot take: the provider's own tables */
  readonly tables: string[]

  /** the fields of declared properties, at every depth, each with the type its view reads it as */
  fields(properties: Record<string, Property>): Field[]

  /** the labels written, with their counts and their times */
  labels(): Promise<Label[]>

  /** the components with a state, with how many entities each has */
  states(): Promise<Summary[]>

  /** the names of encounters, with their counts, their times and the fields their payloads have */
  encounters(): Promise<Encountered[]>

  /** a statement of the dialect, run as a reader that can read the log and nothing else */
  query(sql: string): Promise<Result>

  /** refuses what a view could not be: anything but one statement a query could run */
  validate(sql: string): Promise<void>

  /** the views defined over the log */
  views(): Promise<View[]>

  /** a view of `name`, replacing one there is; with `refresh`, recomputed on that cycle */
  define(definition: Definition): Promise<void>

  drop(name: string): Promise<void>
}

/** A row of `events`. */
export interface Row {
  /** the same however many times it is delivered */
  id: string

  /** `<component>.<event>`, or `<component>.<name>` for a fact */
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

/** A row of `encounters`: what a client sent. */
export interface Encounter {
  /** the client's own */
  id: string
  name: string

  /** when it happened, by the gateway's clock, at the distance from sending the client measured */
  time: number

  /** when the gateway received it */
  received: number

  /** the client's id of itself, and of the period of its activity, where it gave them */
  visitor: string | null
  session: string | null

  /** the identity the gateway verified the client to be */
  identity: string | null

  /** the address and the country the request came from */
  ip: string | null
  country: string | null

  /** the origin of the page that sent it, and the client's `user-agent` */
  origin: string | null
  agent: string | null

  /** what the agent says the client is: its browser, its system, its kind of device */
  browser: string | null
  os: string | null
  device: string | null

  payload: object
}

export interface Label {
  label: string
  rows: number
  first: string
  last: string
}

export interface Summary {
  component: string
  entities: number

  /** when the latest change of an entity was made */
  last: string
}

export interface Encountered {
  name: string
  rows: number
  first: string
  last: string
  received: string

  /** the paths of the latest payloads, each with the types it was sent as */
  fields: Array<{ path: string; types: string[] }>
}

/** A field of a declared payload, and the type its view reads it as. */
export interface Field {
  path: string
  type: string
  description?: string

  /** the expression that reads it from its table in its type, of a property of the payload */
  read?: string
}

export interface Definition {
  name: string
  sql: string

  /** seconds between computations of a view that is a table */
  refresh?: number

  title?: string
  description?: string
}

export interface View extends Definition {
  /** what a query reads it by */
  read: string

  /** when a view that is a table was last computed */
  refreshed?: string
}

export interface Result {
  columns: Array<{ name: string; type: string }>
  rows: unknown[][]
  truncated: boolean
}

/** What a provider refused a statement with, in its own words. */
export class Refusal extends Error {}
