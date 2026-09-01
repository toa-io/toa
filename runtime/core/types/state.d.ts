import * as _entity from './entity'
import * as _storages from './storages'

declare namespace toa.core {

  namespace transition {

    type Event = {
      /** the pre-image; null when the entity did not exist before */
      origin: Object | null
      state: Object
      /** out-of-band values an algorithm wrote into `state._trailers`; must be serializable */
      trailers?: Object
      input?: Object
    }

  }

  interface State {
    init(id: string): _entity.Entity

    object(query: _storages.Query, mutable?: boolean): Promise<_entity.Entity>

    objects(query: _storages.Query, mutable?: boolean): Promise<_entity.Entity[]>

    changeset(query: _storages.Query): _entity.Changeset

    none(): null

    commit(entity: _entity.Entity, input?: Object): Promise<boolean>

    apply(changeset: _entity.Changeset, input?: Object): Promise<_storages.Record>
  }

}

export type State = toa.core.State
export type Event = toa.core.transition.Event
