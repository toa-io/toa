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

  type Declaration = Record<string, declaration.Sample>

  type Sample = {
    payload?: object
    request?: _operations.Sample | null
  }

  type Set = Record<string, Sample>

}

export type Sample = toa.samples.messages.Sample
export type Set = toa.samples.messages.Set
