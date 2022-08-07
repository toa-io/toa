import { Connector } from '@toa.io/core/types'
import { Entity } from '@toa.io/core/types/storages'

declare namespace toa.sql {

  interface Client extends Connector {

    insert(object: Entity): Promise<boolean>

    update(criteria: Object, object: Entity): Promise<boolean>

  }

}
