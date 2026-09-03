import type * as _operator from './operator.js'
import * as _registry from './registry.js'

declare namespace toa.deployment {

  interface Factory {
    operator(): _operator.Operator

    registry(): _registry.Registry
  }

}

export type Factory = toa.deployment.Factory
