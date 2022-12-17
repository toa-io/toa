import type * as _operations from './operations'

declare namespace toa.samples.messages {

  type Declaration = {
    component?: string
    message?: object
    payload?: object
    input?: object
    query?: object
    request?: _operations.Sample | null
  }

  type Sample = {
    payload?: object
    request?: _operations.Sample | null
  }

  type Set = {
    [label: string]: Sample
  }

}

export type Messages = toa.samples.messages.Set
