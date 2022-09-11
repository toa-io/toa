import * as _event from './event'
import * as _storages from './storages'

declare namespace toa.core {

  namespace entity {

    interface Factory {
      init(id: string): Entity

      object(record: Object): Entity

      objects(recordset: Object[]): Entity[]

      changeset(query: _storages.Query): Changeset
    }

  }

  interface Entity {
    get(): _storages.Record

    set(value: _storages.Record): void

    event(): _event.Event
  }

  type Upsert = {
    changeset: Object
    insert: Object
  }

  interface Changeset {
    query: _storages.Query

    get(): Object

    set(value: Object): void

    export(): Upsert
  }

}

export type Entity = toa.core.Entity
export type Changeset = toa.core.Changeset
