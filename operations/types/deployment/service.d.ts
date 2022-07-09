// noinspection ES6UnusedImports

import type { Deployable } from './deployment'

declare namespace toa.deployment {

    interface Ingress {
        host: string
        class: string
        annotations?: object
    }

    interface Service extends Deployable {
        port: number
        ingress?: Ingress
    }
    
}

export type Service = toa.deployment.Service
