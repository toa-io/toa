// noinspection ES6UnusedImports

import type { DeploymentInstallationOptions } from './deployment'

declare namespace toa.operations.deployment {

    interface OperatorInstallationOptions extends DeploymentInstallationOptions {
    }

    interface Operator {
        export(path?: string): Promise<string>

        prepare(path?: string): Promise<string>

        build(): Promise<void>

        install(options?: OperatorInstallationOptions): Promise<void>
    }

}

export type Operator = toa.operations.deployment.Operator
