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

    type Storage = {
      current?: _core.storages.Record
      next?: _core.storages.Record
    }
  }

  type Sample = {
    input?: any
    reply?: _core.Reply
    context?: sample.Context
    storage?: sample.Storage
  }

}

export type Sample = toa.sampling.Sample
