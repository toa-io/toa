import * as _state from './state'
import * as _atomicity from './atomicity'

declare namespace toa.core {

  namespace outbox {

    /**
     * The intent to publish, committed with the state change it belongs to. Everything about
     * it is core's: the storage writes it and, where the images are the write's own, fills
     * `event.origin` and `event.state` in.
     */
    interface Row {
      id: string

      /** which replica pumps this row; carries no other meaning, and no ordering */
      lane: number

      published: boolean

      /** not before this */
      pending: number

      event: _state.Event
    }

    /** What a storage offers when it can commit a row atomically with the entity. */
    interface Storage {
      insert (row: Row, session?: unknown): Promise<void>

      insertMany (rows: Row[], session?: unknown): Promise<void>

      /**
       * One page of what is due, still unpublished, and in one of the given lanes, in the
       * order the rows were written. `after` continues from the last id of the page before.
       */
      pending (lanes: number[], now: number, limit: number, after?: string): Promise<Row[]>

      settle (ids: string[]): Promise<void>
    }

  }

}

export type Row = toa.core.outbox.Row
export type Storage = toa.core.outbox.Storage

/**
 * A lane is a slot of `atomicity`: which replica pumps a row, and nothing else. The outbox is
 * the first thing to claim slots this way, not the last.
 */
export type Atom = _atomicity.Atom
