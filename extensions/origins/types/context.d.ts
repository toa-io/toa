// noinspection ES6UnusedImports

import * as core from '@toa.io/core/types'
import * as generic from '@toa.io/libraries/generic/types'
import * as fetch from 'node-fetch'

declare namespace toa.extensions.origins {

    namespace invocation {
        type Options = {
            substitutions?: string[]
            retry?: generic.retry.Options
        }
    }

    interface Context extends core.extensions.Context {
        invoke(name: string, path: string, request: fetch.Request, options?: invocation.Options): Promise<fetch.Response>
    }

}
