// noinspection ES6UnusedImports

import type { Deployable } from './deployment'

declare namespace toa.operations.deployment {

    interface Service extends Deployable {
        port: number
    }

}

export type Service = toa.operations.deployment.Service
