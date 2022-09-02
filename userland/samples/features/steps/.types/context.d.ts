import * as _stage from '@toa.io/userland/stage'
import * as _samples from '@toa.io/userland/samples'

declare namespace toa.samples.features {

  type Context = {
    component?: string
    operation?: string
    samples?: _samples.Declaration[]
    stage?: _stage.Stage
    ok?: boolean
  }

}
