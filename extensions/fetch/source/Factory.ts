import { Aspect } from './Aspect'
import type { Locator, extensions } from '@toa.io/core'

export class Factory implements extensions.Factory {
  public aspect (locator: Locator): extensions.Aspect {
    return new Aspect(locator)
  }
}
