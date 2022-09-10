import { Connector } from '@toa.io/core/types'
import { Record } from '@toa.io/core/types/storages'

declare namespace toa.sql {

  interface Storage extends Connector {
    store(entity: Record): Promise<boolean>
  }

}

export type Storage = toa.sql.Storage
