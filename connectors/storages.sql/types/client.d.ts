import { Connector } from '@toa.io/core'
import type { storages } from '@toa.io/core/types'

declare namespace toa.sql{

  interface Client extends Connector{

    insert (object: storages.Record): Promise<boolean>

    update (criteria: Object, object: storages.Record): Promise<boolean>

  }

}
