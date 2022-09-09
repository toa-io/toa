import * as _entity from './entity'
import * as _query from './query'

declare namespace toa.core {

  interface State {
    init(id: string): _entity.Entity

    object(query: _query.Query): Promise<_entity.Entity>

    objects(query: _query.Query): Promise<_entity.Entity[]>

    changeset(query: _query.Query): _entity.Changeset
  }

}
