// noinspection ES6UnusedImports

import type * as connectors from '@toa.io/libraries/connectors/types'

declare namespace toa.mongodb {

    interface Pointer extends connectors.Pointer {
        db: string
        collection: string
    }

}
