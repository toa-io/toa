// noinspection ES6UnusedImports

import { Connector, Locator } from './index'

declare namespace toa.core.extensions {

    interface Factory {
        connector?(locator: Locator, declaration: Object): Connector | undefined

        context?(locator: Locator, declaration: Object): Context

        service?(name?: string): Connector | undefined
    }

    interface Context extends Connector {
        name: string
        invoke: Function
    }

}

export type Factory = toa.core.extensions.Factory
export type Context = toa.core.extensions.Context
