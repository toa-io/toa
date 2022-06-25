// noinspection ES6UnusedImports

import { Connector } from './connector'

declare namespace toa.core {

    namespace reflection {
        type Source<T> = () => Promise<T>
    }

    interface Reflection<T> extends Connector {
        value: T
    }

}
