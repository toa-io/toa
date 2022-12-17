import * as _core from '@toa.io/core/types'

declare namespace toa.sampling {

  namespace sample {

    namespace context {

      type Request = {
        request?: _core.Request
        reply?: _core.Reply
      }

      type Requests = {
        [key: string]: Request[]
      }

    }

    type Context = {
      local?: context.Requests
      remote?: context.Requests
    }

    type Storage = {
      current?: _core.storages.Record
      next?: _core.storages.Record
    }

    namespace extensions {

      type Call = {
        arguments?: any[]
        result?: any
        permanent?: boolean
      }

    }

    type Extensions = {
      [key: string]: extensions.Call[]
    }

    type Events = {
      [key: string]: _core.Message
    }
  }

  type Sample = {
    autonomous?: boolean
    reply?: _core.Reply
    context?: sample.Context
    storage?: sample.Storage
    events?: sample.Events
    extensions?: sample.Extensions
  }

}

export type Sample = toa.sampling.Sample
