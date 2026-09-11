// noinspection ES6UnusedImports

import type { Composition } from '@toa.io/norm'
import type { dependency } from '../dependency.d.ts'
import type { Image } from './image.d.ts'

declare namespace toa.deployment.images {
  interface Registry {
    composition(composition: Composition): Image

    service(path: string, service: dependency.Service): Image

    prepare(target: string): Promise<void>

    push(): Promise<void>
  }
}
