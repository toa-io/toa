import * as _event from './event'
import * as _query from './query'

declare namespace toa.core {

  namespace entity {

    interface Factory {
      init(id: string): Entity

      object(record: Object): Entity

      objects(recordset: Object[]): Entity[]

      changeset(query: _query.Query): Changeset
    }
    
  }

  interface Entity {
    get(): Object

    set(value: Object): void

    event(): _event.Event
  }

  type Upsert = {
    changeset: Object
    insert: Object
  }

  interface Changeset {
    get(): Object

    set(value: Object): void

    export(): Upsert
  }

}

export type Entity = toa.core.Entity
export type Changeset = toa.core.Changeset
