// noinspection ES6UnusedImports

import type { Composition } from '@toa.io/norm'
import type { Image } from './image'
import type { dependency } from '../dependency'

declare namespace toa.operations.deployment.images {

    interface Factory {
        composition(composition: Composition): Image

        service(path: string, service: dependency.Service): Image
    }

}

export type Factory = toa.operations.deployment.images.Factory
