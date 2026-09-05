import type { Event } from './state.js'

/**
 * The intent to publish, committed with the state change it belongs to. Everything about it
 * is core's: the storage writes it and, where the images are the write's own, fills
 * `event.origin` and `event.state` in.
 */
export interface Row {
  id: string

  /** which replica pumps this row; carries no other meaning, and no ordering */
  lane: number

  published: boolean

  /** not before this */
  pending: number

  /** an assignment's images are absent until the storage fills them in */
  event: Event
}

/**
 * The read side of an outbox. What writes a row is the storage's own: it happens inside the
 * transaction the storage opened, which core never reaches into.
 */
export interface Storage {
  /**
   * One page of what is due, still unpublished, and in one of the given lanes, in the order
   * the rows were written. `after` continues from the last id of the page before.
   */
  pending (lanes: number[], now: number, limit: number, after?: string): Promise<Row[]>

  settle (ids: string[]): Promise<void>
}
