// noinspection ES6UnusedImports

import type { Deployable } from './deployment'

declare namespace toa.operations.deployment {

    interface Composition extends Deployable {
        components: Array<string>
    }

}

export type Composition = toa.operations.deployment.Composition
