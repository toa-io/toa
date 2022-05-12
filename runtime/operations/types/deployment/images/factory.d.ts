// noinspection ES6UnusedImports

import { Composition } from '@toa.io/formation/types'
import { Image } from './image'

declare namespace toa.operations.deployment.images {

    interface Factory {
        composition(composition: Composition): Image
    }

}
