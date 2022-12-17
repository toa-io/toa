import type * as _operations from './operations'

declare namespace toa.samples.messages {

  namespace declaration {

    type Sample = {
      component?: string
      message?: object
      payload?: object
      input?: object
      query?: object
      request?: _operations.Sample | null
    }

  }

  type Declaration = {
    [key: string]: declaration.Sample
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
