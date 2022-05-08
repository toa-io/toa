// noinspection ES6UnusedImports

import type { Composition } from "./composition"
import type { Reference } from './dependency'

declare namespace toa.operations.deployment {

    interface Declaration {
        apiVersion: string
        type: string
        name: string
        description?: string
        version: string
        appVersion: string
        dependencies: Array<Reference>
    }

    interface Contents extends Object {
        compositions: Array<Composition>
        components: Array<string>
    }

    interface DeploymentInstallationOptions {
        dry?: boolean
        wait?: boolean
    }

    interface Deployment {
        export(target: string): Promise<void>

        install(options: DeploymentInstallationOptions): Promise<void>
    }

}

export type DeploymentInstallationOptions = toa.operations.deployment.DeploymentInstallationOptions
