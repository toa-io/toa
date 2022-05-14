// noinspection ES6UnusedImports

import { Connector, Reply, Request } from './'

declare namespace toa.core {

    interface Runtime extends Connector {
        invoke(endpoint: string, request: Request): Reply
    }

}

export type Runtime = toa.core.Runtime
