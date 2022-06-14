// noinspection ES6UnusedImports

import { Request } from './request'
import { Reply } from './reply'
import * as extensions from './extensions'

declare namespace toa.core {

    interface Context {
        extensions: extensions.Context[]

        /**
         * Calls local endpoint
         */
        apply(endpoint: string, request: Request): Promise<Reply>

        /**
         * Calls remote endpoint
         */
        call(domain: string, name: string, endpoint: string, request: Request): Promise<Reply>
    }

}

export type Context = toa.core.Context
