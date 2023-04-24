import * as fetch from 'node-fetch'
import * as _extensions from '@toa.io/core/types/extensions'
import * as _retry from '@toa.io/generic/types/retry'

declare namespace toa.origins.http {

  namespace invocation {
    type Options = {
      substitutions?: string[]
      retry?: _retry.Options
    }
  }

  interface Aspect extends _extensions.Aspect {
    invoke(origin: string, path: string, request?: fetch.RequestInit, options?: invocation.Options): Promise<fetch.Response>

    invoke(url: string, request?: fetch.RequestInit): Promise<fetch.Response>
  }

}
