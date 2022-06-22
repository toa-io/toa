// noinspection ES6UnusedImports

import * as core from '@toa.io/core/types'
import { Request, Response } from 'node-fetch'

declare namespace toa.extensions.origins {

    namespace invocation {
        type Options = {
            substitutions: string[]
        }
    }

    interface Context extends core.extensions.Context {
        invoke(name: string, path: string, request: Request, options?: invocation.Options): Response
    }

}
