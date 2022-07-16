// noinspection ES6UnusedImports

import { dependency } from '@toa.io/operations/types/deployment'
import { dependencies } from '@toa.io/norm/types'
import { URIs } from './uris'

declare namespace toa.pointer {

  namespace deployment {

    type Validator = (uris: URIs) => void

    type Options = {
      prefix: string
      extensions?: string[]
      validator?: Validator
    }

  }

  type Deployment = (instances: dependencies.Instance[], uris: URIs, options: deployment.Options)
    => dependency.Declaration

}

export const deployment: toa.pointer.Deployment
