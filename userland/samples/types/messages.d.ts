import type * as _core from '@toa.io/core/types'
import type * as _operations from './operations'

declare namespace toa.samples.messages {

  type Declaration = {
    component?: string
    payload?: object
    input?: object
    query?: object
    invocation?: _operations.Declaration | null
  }

  type Sample = {
    payload?: object
    request?: _core.Request
    invocation?: _operations.Sample | null
  }

  type Set = {
    [label: string]: Sample
  }

}

export type Messages = toa.samples.messages.Set

