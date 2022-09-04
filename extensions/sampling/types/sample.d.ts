import { Reply } from '@toa.io/core/types'

declare namespace toa.sampling {

  namespace sample {

    type Calls = {
      [key: string]: Sample
    }

    type Context = {
      local?: Calls
      remote?: Calls
    }
  }

  type Sample = {
    input?: any
    reply?: Reply
    context?: sample.Context
  }

}

export type Sample = toa.sampling.Sample
