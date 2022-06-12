// noinspection ES6UnusedImports

import { Request } from './request'
import { Reply } from './reply'

declare namespace toa.core {

    namespace context {
        interface Extension {
            name: string
            invoke: Function
        }
    }

    interface Context {
        extensions: context.Extension[]

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
export type Extension = toa.core.context.Extension
