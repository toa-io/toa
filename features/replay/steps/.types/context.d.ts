import * as _stage from '@toa.io/userland/stage'
import * as _samples from '@toa.io/userland/samples'

declare namespace toa.samples.features {

  type Operation = {
    endpoint: string
    samples: _samples.operations.Sample[]
  }

  type Receiver = {
    label: string
    samples: _samples.messages.Sample[]
  }

  type Context = {
    component?: string
    operation?: Operation
    receiver?: Receiver
    stage?: _stage.Stage
    ok?: boolean
  }

}
