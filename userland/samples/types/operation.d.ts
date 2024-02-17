import * as _core from '@toa.io/core'
import * as _sampling from '@toa.io/extensions.sampling/types/request'

declare namespace toa.samples{

  namespace operations{

    type Call = {
      input?: any
      output?: any
    }

    type Calls = Record<string, Call[]>

    type Events = Record<string, Object>

    type Set = Record<string, Operation[]>

  }

  type Operation = {
    title?: string
    input?: any
    output?: any
    current?: _core.storages.Record
    next?: _core.storages.Record
    remote?: operations.Calls
    local?: operations.Calls
    events?: operations.Events
    extensions?: _sampling.Extensions
  }

}

export type Operation = toa.samples.Operation
export type Set = toa.samples.operations.Set
