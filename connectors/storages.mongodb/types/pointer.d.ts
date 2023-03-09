import type { Pointer as Base } from '@toa.io/pointer/types'

declare namespace toa.mongodb {

    interface Pointer extends Base {
        db: string
        collection: string
    }

}
