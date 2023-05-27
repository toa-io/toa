import type * as _operator from './operator'
import * as _registry from './registry'

declare namespace toa.deployment {

  interface Factory {
    operator(): _operator.Operator

    registry(): _registry.Registry
  }

}

export type Factory = toa.deployment.Factory
