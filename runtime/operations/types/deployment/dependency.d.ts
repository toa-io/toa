// noinspection JSUnusedGlobalSymbols,ES6UnusedImports

import { Service } from './service'

declare namespace toa.operations.deployment {

    namespace dependency {

        type Constructor = (declarations: object[], annotations: object) => Declaration

        interface Reference {
            name: string
            version: string
            repository?: string
            alias?: string
            values?: Object
        }

        interface Service {
            group: string
            name: string
            version: string
            port: number
            ingress?: {
                host: string
                class: string
                annotations?: object
            }
        }

        interface Declaration {
            references?: Array<Reference>
            services?: Array<Service> // dependency.Service
        }

    }

    interface Dependency {
        references?: dependency.Reference[]
        services?: Service[] // deployment.Service
    }

}

export namespace dependency {
    export type Reference = toa.operations.deployment.dependency.Reference
    export type Service = toa.operations.deployment.dependency.Service
}

export type Dependency = toa.operations.deployment.Dependency
