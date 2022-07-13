import type { Pointer as Base } from '@toa.io/libraries/connectors/types'

declare namespace toa.mongodb {

    interface Pointer extends Base {
        db: string
        collection: string
    }

}
