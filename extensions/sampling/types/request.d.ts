import type * as _core from '@toa.io/core/types'

declare namespace toa.sampling {

  namespace request {

    namespace context {

      type Call = {
        request?: _core.Request
        reply?: _core.Reply
      }

      type Calls = Record<string, Call[]>

    }

    namespace extensions {

      type Call = {
        arguments?: any[]
        result?: any
        permanent?: boolean
      }

    }

    type Context = {
      local?: context.Calls
      remote?: context.Calls
    }

    type Storage = {
      current?: _core.storages.Record | _core.storages.Record[]
      next?: _core.storages.Record
    }

    type Extensions = Record<string, extensions.Call[]>

    type Events = Record<string, _core.Message>

    type Sample = {
      autonomous?: boolean
      title?: string
      request?: _core.Request
      reply?: _core.Reply
      context?: Context
      storage?: Storage
      events?: Events
      extensions?: Extensions
      terminate?: boolean
    }

  }

  type Request = _core.Request & {
    sample?: request.Sample
  }

}

export type Request = toa.sampling.Request
export type Storage = toa.sampling.request.Storage
export type Sample = toa.sampling.request.Sample
export type Context = toa.sampling.request.Context
