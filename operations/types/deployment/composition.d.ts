// noinspection ES6UnusedImports

import type { Deployable } from './deployment'

declare namespace toa.deployment {

    interface Composition extends Deployable {
        components: Array<string>
    }

}

export type Composition = toa.deployment.Composition
