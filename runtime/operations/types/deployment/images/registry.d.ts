// noinspection ES6UnusedImports

import type { Composition } from '@toa.io/formation'
import type { dependency } from '../dependency'
import type { Image } from "./image"

declare namespace toa.operations.deployment.images {

    interface Registry {
        composition(composition: Composition): Image

        service(path: string, service: dependency.Service): Image

        prepare(target: string): Promise<void>

        push(): Promise<void>
    }

}

