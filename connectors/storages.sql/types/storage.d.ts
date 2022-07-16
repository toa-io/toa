import { Connector } from '@toa.io/core/types'
import { Entity } from '@toa.io/core/types/storages'

declare namespace toa.sql {

  interface Storage extends Connector {
    store(entity: Entity): Promise<boolean>
  }

}

export type Storage = toa.sql.Storage
