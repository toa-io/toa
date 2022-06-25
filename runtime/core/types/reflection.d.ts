// noinspection ES6UnusedImports

import { Connector } from './connector'

declare namespace toa.core {

    namespace reflection {
        type Source = () => Promise<any>
    }

    interface Reflection extends Connector {
        value: any
    }

}

export type Reflection = toa.core.Reflection
export type Source = toa.core.reflection.Source
