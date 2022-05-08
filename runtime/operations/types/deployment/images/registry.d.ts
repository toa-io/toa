// noinspection ES6UnusedImports

import type { Composition } from '@toa.io/formation/types'
import type { Image } from "./image"

declare namespace toa.operations.deployment.images {

    interface Registry {
        composition(composition: Composition): Image

        prepare(target: string): Promise<void>

        push(): Promise<void>
    }

}

