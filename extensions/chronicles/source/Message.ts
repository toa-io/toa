/** What every source publishes on the channel, and what ClickHouse parses. */
export interface Message {
  /** the same however many times it is delivered */
  id: string

  /** `<component>.<event>`, `<component>.<name>` for a fact, `client.<name>` for a browser */
  label: string

  /** the component that published it */
  component: string

  /** when it happened, in milliseconds */
  time: number

  /** the id of the record that changed */
  entity: string | null

  /** its `VERSION` */
  version: number | null

  /** the W3C traceparent of the call that caused it */
  trace: string | null

  payload: unknown
}

/** When a row was written: the milliseconds a version 7 uuid begins with. */
export function time(id: string): number {
  return parseInt(id.slice(0, 12), 16)
}
