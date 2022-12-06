import * as _core from '@toa.io/core/types'

declare namespace toa.sampling {

  namespace sample {

    type Request = {
      request?: _core.Request
      reply?: _core.Reply
    }

    type Requests = {
      [key: string]: Request[]
    }

    type Context = {
      local?: Requests
      remote?: Requests
    }

    type Storage = {
      current?: _core.storages.Record
      next?: _core.storages.Record
    }

    type Call = {
      arguments?: any[]
      result?: any
      permanent?: boolean
    }

    type Events = {
      [key: string]: Object
    }

    type Extensions = {
      [key: string]: Call[]
    }
  }

  type Sample = {
    autonomous?: boolean
    input?: any
    reply?: _core.Reply
    context?: sample.Context
    storage?: sample.Storage
    events?: sample.Events
    extensions?: sample.Extensions
  }
}

export type Sample = toa.sampling.Sample
