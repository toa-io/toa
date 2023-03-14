import { dependency } from '@toa.io/operations/types/deployment'
import { dependencies } from '@toa.io/norm/types'
import * as _uris from './uris'

declare namespace toa.pointer {

  namespace deployment {

    type Options = {
      prefix: string
    }

  }

  type Deployment = (
    instances: dependencies.Instance[],
    uris: _uris.URIs,
    options: deployment.Options
  ) => dependency.Declaration

}
