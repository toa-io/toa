import type * as _core from '@toa.io/core/types'
import type * as _request from './request'

declare namespace toa.sampling {

  namespace messages {

    type Sample = {
      autonomous?: boolean
      input: object
      query: _core.Query
      request?: _request.Request
    }

  }

  type Message = _core.Message & {
    sample: messages.Sample
  }

}
