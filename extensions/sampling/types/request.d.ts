import type * as _core from '@toa.io/core/types'

declare namespace toa.sampling {

  namespace request {

    namespace context {

      type Request = {
        request?: _core.Request
        reply?: _core.Reply
      }

      type Requests = {
        [key: string]: Request[]
      }

    }

    namespace extensions {

      type Call = {
        arguments?: any[]
        result?: any
        permanent?: boolean
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

    type Extensions = Record<string, extensions.Call>
    type Events = Record<string, _core.Message>

    type Sample = {
      autonomous?: boolean
      request?: _core.Request
      reply?: _core.Reply
      context?: Context
      storage?: Storage
      events?: Events
      extensions?: Extensions
    }

  }

  type Request = _core.Request & {
    sample?: request.Sample
  }

}

export type Request = toa.sampling.Request
export type Sample = toa.sampling.request.Sample
