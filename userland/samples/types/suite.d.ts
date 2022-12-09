import { Operations } from './operations'
import { Messages } from './messages'

declare namespace toa.samples {

  type Component = {
    operations?: Operations
    messages?: Messages
  }

  type Components = {
    [key: string]: Component
  }

  type Suite = {
    autonomous: boolean
    components?: Components
  }

}

export type Suite = toa.samples.Suite
