import { Connector } from '@toa.io/core'
import { Record } from '@toa.io/core/types/storages'

declare namespace toa.sql{

  interface Client extends Connector{

    insert (object: Record): Promise<boolean>

    update (criteria: Object, object: Record): Promise<boolean>

  }

}
