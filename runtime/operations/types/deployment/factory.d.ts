// noinspection ES6UnusedImports
import type { Operator } from './operator'

declare namespace toa.operations.deployment {

    interface Factory {
        operator(): Operator
    }

}

export type Factory = toa.operations.deployment.Factory
