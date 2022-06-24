// noinspection ES6UnusedImports

import * as core from '@toa.io/core/types'

declare namespace toa.extensions.configuration {

    interface Context extends core.extensions.Context {
        invoke(path?: string[]): any
    }

}
