import * as _operations from './operations'
import * as _messages from './messages'

declare namespace toa.samples {

  type Component = {
    operations?: _operations.Set
    messages?: _messages.Set
  }

  type Components = Record<string, Component>

  type Suite = {
    autonomous: boolean
    components?: Components
  }

}

export type Suite = toa.samples.Suite
