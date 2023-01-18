import type * as _core from '@toa.io/core'

declare namespace toa.samples.operations {

  namespace declaration {

    namespace context {

      type Call = {
        input?: any
        output?: any
      }

      type Calls = {
        [key: string]: Call | Call[]
      }

    }

  }

  type Events = {
    [key: string]: Object
  }

  type Extension = [{
    arguments?: any[]
    result?: any
    permanent?: boolean
  }]

  type Extensions = {
    [key: string]: Extension
  }

  type Declaration = {
    title?: string
    input?: any
    output?: any
    local?: declaration.context.Calls
    remote?: declaration.context.Calls
    current?: Object | Object[]
    next?: Object
    events?: Events
    extensions?: Extensions

    [key: string]: any // concise declarations
  }

  type Reply = {
    output: any
  }

  type Call = {
    title?: any
    request: _core.Request
    reply?: Reply
  }

  namespace context {

    type Calls = {
      [key: string]: Call[]
    }

  }

  type Context = {
    local?: context.Calls
    remote?: context.Calls
  }

  type Storage = {
    current?: Object | Object[]
    next?: Object
  }

  type Sample = {
    title?: string
    request: _core.Request
    reply: Reply
    context?: Context
    storage?: Storage
    events?: Events
    extensions?: Extensions
  }

  type Set = Record<string, Sample[]>

}

export type Declaration = toa.samples.operations.Declaration
export type Sample = toa.samples.operations.Sample
export type Operations = toa.samples.operations.Set
