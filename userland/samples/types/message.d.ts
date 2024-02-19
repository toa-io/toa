import type * as _core from '@toa.io/core'
import type * as _operation from './operation'

declare namespace toa.samples{

  namespace messages{

    type Set = Record<string, Message[]>

  }

  type Message = {
    title?: string
    component: string
    payload: Object
    input?: any
    query?: _core.Query
    request?: _operation.Operation | null
  }

}

export type Message = toa.samples.Message
export type Set = toa.samples.messages.Set
