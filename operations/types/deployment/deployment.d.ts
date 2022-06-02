// noinspection ES6UnusedImports,JSUnusedGlobalSymbols

import type { Composition } from './composition'
import type { Service } from './service'
import type { dependency } from './dependency'

declare namespace toa.operations.deployment {

    interface Declaration {
        apiVersion: string
        type: string
        name: string
        description?: string
        version: string
        appVersion: string
        dependencies: Array<dependency.Reference>
    }

    interface Contents {
        compositions: Array<Composition>
        components: Array<string>
        services?: Array<Service>
    }

    namespace installation {

        interface Options {
            wait?: boolean
        }

    }

    interface Deployable {
        name: string
        image: string
    }

    interface Deployment {
        export(target: string): Promise<void>

        install(options: installation.Options): Promise<void>

        template(): Promise<string>
    }

}

export namespace installation {
    export type Options = toa.operations.deployment.installation.Options
}

export type Deployable = toa.operations.deployment.Deployable
