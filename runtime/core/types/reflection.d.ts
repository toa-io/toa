// noinspection ES6UnusedImports

import { Connector } from './connector'

declare namespace toa.core {

    namespace reflection {
        type Source = () => Promise<any>
    }

    interface Reflection<T> extends Connector {
        value: T
    }
}

export type Source = toa.core.reflection.Source
