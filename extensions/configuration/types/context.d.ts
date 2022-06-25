// noinspection ES6UnusedImports

import { Context } from '@toa.io/core/types/extensions'

type Extension = Context

declare namespace toa.extensions.configuration {

    interface Context extends Extension {
        invoke(path?: string[]): any
    }

}
