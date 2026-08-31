import * as _state from './state'

declare namespace toa.core {

  namespace outbox {

    /**
     * The intent to publish, committed with the state change it belongs to. Everything about
     * it is core's: the storage writes it and, where the images are the write's own, fills
     * `event.origin` and `event.state` in.
     */
    interface Row {
      id: string

      /** which replica sweeps this row; carries no other meaning, and no ordering */
      lane: number

      published: boolean

      /** not before this */
      pending: number

      event: _state.Event
    }

    /**
     * Which lanes this replica owns. Read on both paths — at write time to pick a lane for a
     * new row, and at sweep time to decide what to look at — which is what keeps a row with
     * the process that wrote it.
     */
    interface Partition extends Connector {
      /**
       * `null` while this replica owns nothing, which suspends its sweep: reading without an
       * assignment would be a different guarantee, one where every replica publishes every
       * stranded row.
       */
      lanes (total: number): number[] | null
    }

    interface Factory {
      partition (locator: Locator, options?: object): Partition
    }

    /** What a storage offers when it can commit a row atomically with the entity. */
    interface Storage {
      insert (row: Row, session?: unknown): Promise<void>

      insertMany (rows: Row[], session?: unknown): Promise<void>

      /** due, still unpublished, and in one of the given lanes */
      pending (lanes: number[], now: number, limit: number): Promise<Row[]>

      settle (ids: string[]): Promise<void>
    }

  }

}

export type Row = toa.core.outbox.Row
export type Partition = toa.core.outbox.Partition
export type Factory = toa.core.outbox.Factory
export type Storage = toa.core.outbox.Storage
