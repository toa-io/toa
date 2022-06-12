// noinspection ES6UnusedImports

import { Connector, Locator } from '.'
import * as context from './context'

declare namespace toa.core.extensions {

    interface Factory {
        connector?(locator: Locator, declaration: Object): Connector | undefined

        service?(name: string): Connector | undefined

        contexts?(declaration: Object): context.Extension[]
    }

}

export type Factory = toa.core.extensions.Factory
