// noinspection ES6UnusedImports

import { installation, template } from './deployment'

declare namespace toa.operations.deployment {

    interface Operator {
        export(path?: string): Promise<string>

        prepare(path?: string): Promise<string>

        build(): Promise<void>

        install(options?: installation.Options): Promise<void>

        template(options?: template.Options): Promise<string>
    }

}

export type Operator = toa.operations.deployment.Operator
