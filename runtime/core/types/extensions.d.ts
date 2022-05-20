// noinspection ES6UnusedImports

import { Connector, Locator } from '.'

declare namespace toa.core.extensions {

    interface Factory {
        connector(locator: Locator, definition: Object): Connector | undefined

        service(name: string): Connector | undefined
    }

}

export type Factory = toa.core.extensions.Factory
