import { Connector } from '@toa.io/core'
import { Entity } from '@toa.io/core/types/storages'

declare namespace toa.sql{

  interface Connection extends Connector{

    insert (table: string, objects: Entity[]): Promise<boolean>

    update (table: string, criteria: Object, object: Entity): Promise<boolean>

  }

}
