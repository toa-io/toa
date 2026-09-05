import { Connector } from '@toa.io/core'
import type { storages } from '@toa.io/core/types'

declare namespace toa.sql{

  interface Storage extends Connector{
    store (entity: storages.Record): Promise<boolean>
  }

}

export type Storage = toa.sql.Storage
