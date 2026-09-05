import { Aspect } from './Aspect.js'
import type { Locator } from '@toa.io/core'
import type { extensions } from '@toa.io/core/types'

export class Factory implements extensions.Factory {
  public aspect (locator: Locator): extensions.Aspect {
    return new Aspect(locator)
  }
}
