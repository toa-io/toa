import * as _entity from './entity'
import * as _storages from './storages'

declare namespace toa.core {

  namespace transition {

    type Event = {
      origin: Object
      state: Object
      changeset: Object
    }

  }

  interface State {
    init(id: string): _entity.Entity

    object(query: _storages.Query): Promise<_entity.Entity>

    objects(query: _storages.Query): Promise<_entity.Entity[]>

    changeset(query: _storages.Query): _entity.Changeset

    none(): null

    commit(entity: _entity.Entity): Promise<boolean>

    apply(changeset: _entity.Changeset): Promise<void>
  }

}

export type State = toa.core.State
export type Event = toa.core.transition.Event
