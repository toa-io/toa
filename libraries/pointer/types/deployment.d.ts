// noinspection ES6UnusedImports

import { dependency } from '@toa.io/operations/types/deployment'
import { dependencies } from '@toa.io/norm/types'
import { URIs } from './uris'

declare namespace toa.pointer {

  namespace deployment {

    type Options = {
      prefix: string
    }

  }

  type Deployment = (instances: dependencies.Instance[], uris: URIs, options: deployment.Options)
    => dependency.Declaration

}

export const deployment: toa.pointer.Deployment
