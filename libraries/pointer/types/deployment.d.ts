// noinspection ES6UnusedImports

import { dependency } from '@toa.io/operations/types/deployment'
import { dependencies } from '@toa.io/norm/types'
import { URIs } from './uris'

declare namespace toa.pointer {

  type Deployment = (prefix: string,
                     instances: dependencies.Instance[],
                     uris: URIs,
                     extensions?: string[])
    => dependency.Declaration

}

export const deployment: toa.pointer.Deployment
