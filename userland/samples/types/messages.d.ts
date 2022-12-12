import type * as _core from '@toa.io/core/types'

declare namespace toa.samples.messages {

  type Declaration = {
    payload?: object
    input?: object
    query?: object
  }

  type Sample = {
    payload?: object
    request: _core.Request
  }

  type Set = {
    [label: string]: Sample
  }

}

export type Messages = toa.samples.messages.Set

