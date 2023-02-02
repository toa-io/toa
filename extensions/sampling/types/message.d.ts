import type * as _core from '@toa.io/core/types'
import type * as _request from './request'

declare namespace toa.sampling {

  namespace messages {

    type Sample = {
      authentic?: boolean
      component: string
      request: _request.Sample
    }

  }

  type Message = _core.Message & {
    sample?: messages.Sample
  }

}

export type Message = toa.sampling.Message
