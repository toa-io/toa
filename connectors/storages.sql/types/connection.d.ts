import { Connector } from '@toa.io/core'
import type { storages } from '@toa.io/core/types'

declare namespace toa.sql{

  interface Connection extends Connector{

    insert (table: string, objects: storages.Record[]): Promise<boolean>

    update (table: string, criteria: Object, object: storages.Record): Promise<boolean>

  }

}
