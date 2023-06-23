// noinspection ES6UnusedImports

import type { Composition } from '@toa.io/norm/types'
import type { Image } from './image'
import type { dependency } from '../dependency'

declare namespace toa.deployment.images {

    interface Factory {
        composition(composition: Composition): Image

        service(path: string, service: dependency.Service): Image
    }

}

export type Factory = toa.deployment.images.Factory
