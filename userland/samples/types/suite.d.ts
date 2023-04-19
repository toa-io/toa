import * as _operations from './operation'
import * as _messages from './message'

declare namespace toa.samples {

  namespace suite {
    type Operations = Record<string, _operations.Set>

    type Options = {
      id?: string
      component?: string
      integration?: boolean
    }
  }

  type Suite = {
    title: string
    autonomous: boolean
    operations?: suite.Operations
    messages?: _messages.Set
  }

}

export type Suite = toa.samples.Suite
export type Options = toa.samples.suite.Options
