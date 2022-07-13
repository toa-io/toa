// noinspection ES6UnusedImports
import type { Operator } from './operator'

declare namespace toa.deployment {

    interface Factory {
        operator(): Operator
    }

}

export type Factory = toa.deployment.Factory
