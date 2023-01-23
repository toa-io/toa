import * as _operations from './operation'
import * as _messages from './message'

declare namespace toa.samples {

  namespace constructors {
    type Components = (paths: string[]) => Promise<Suite>
  }

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
