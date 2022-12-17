import type * as _core from '@toa.io/core/types'

declare namespace toa.sampling {

  namespace messages {

    type Sample = {
      request?: _core.Request
    }

  }

  type Message = _core.Message & {
    sample: messages.Sample
  }

}
