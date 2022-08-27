import { Component } from '@toa.io/norm/types'

import * as _extensions from '@toa.io/core/types/extensions'
import * as _provider from './provider'

declare namespace toa.extensions.configuration {

  interface Factory extends _extensions.Factory {
    provider(component: Component): _provider.Provider
  }

}
