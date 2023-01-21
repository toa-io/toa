import type * as _core from '@toa.io/core/types'
import type * as _request from './request'

declare namespace toa.sampling {

  namespace messages {

    type Sample = _request.Sample & {
      component: string
    }

  }

  type Message = _core.Message & {
    sample?: messages.Sample
  }

}

export type Message = toa.sampling.Message
