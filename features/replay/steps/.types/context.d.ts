import * as _stage from '@toa.io/userland/stage'
import * as _samples from '@toa.io/userland/samples'

declare namespace toa.samples.features {

  type Operation = {
    endpoint: string
    samples: _samples.Operation[]
  }

  type Message = {
    label: string
    samples: _samples.Message[]
  }

  type Context = {
    autonomous?: boolean
    integration?: boolean
    component?: string
    operation?: Operation
    message?: Message
    stage?: _stage.Stage
    ok?: boolean
  }

}
