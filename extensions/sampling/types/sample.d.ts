import * as _core from '@toa.io/core/types'

declare namespace toa.sampling {

  namespace sample {

    type Call = {
      request?: _core.Request
      reply?: _core.Reply
    }

    type Calls = {
      [key: string]: Call[]
    }

    type Context = {
      local?: Calls
      remote?: Calls
    }
  }

  type Sample = {
    input?: any
    reply?: _core.Reply
    context?: sample.Context
  }

}

export type Sample = toa.sampling.Sample
