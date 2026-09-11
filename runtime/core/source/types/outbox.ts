import type { Connector } from '../connector.ts'
import type { Event } from './state.ts'

/**
 * The intent to publish, committed with the state change it belongs to. Everything about it
 * is core's: the storage writes it and, where the images are the write's own, fills
 * `event.origin` and `event.state` in.
 */
export interface Row {
  id: string

  /** which replica pumps this row; carries no other meaning, and no ordering */
  lane: number

  /** settled for every destination */
  published: boolean

  /** not before this */
  pending: number

  /** the destinations it has not been sent to yet, by name */
  outstanding: string[]

  /**
   * The hops that led to the change. Written onto the row rather than left in scope, because
   * the pump publishes off the operation's path — possibly in another replica, an hour later.
   * Absent on a row written before this existed, which reads as a chain that starts there.
   */
  trail?: string[]

  /** an assignment's images are absent until the storage fills them in */
  event: Event
}

/**
 * Somewhere a committed state change goes. A component's `Emission` is one, under the name
 * `events`; an extension may contribute others, and each is published and settled on its own,
 * so one that is down delays nothing but itself.
 */
export interface Destination extends Connector {
  /** what a row is outstanding for, as the row records it */
  readonly name: string

  /** the row, not its event: what goes on the wire is the chain it carries too */
  emit(row: Row): Promise<void>
}

/**
 * The read side of an outbox. What writes a row is the storage's own: it happens inside the
 * transaction the storage opened, which core never reaches into.
 */
export interface Storage {
  /**
   * One page of what is due, not settled for every destination, and in one of the given lanes,
   * in the order the rows were written. `after` continues from the last id of the page before.
   */
  pending(lanes: number[], now: number, limit: number, after?: string): Promise<Row[]>

  /**
   * Takes `destinations` out of what those rows are outstanding for, and marks published the
   * ones left outstanding for nothing. Several destinations at once, because the ordinary case
   * is all of them landing in one window, and that is then one write.
   */
  settle(ids: string[], destinations: string[]): Promise<void>
}
