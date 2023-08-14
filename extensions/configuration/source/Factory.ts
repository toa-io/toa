import { type Locator, type extensions } from '@toa.io/core'
import { Aspect } from './Aspect'
import { type Manifest } from './manifest'
import { get } from './configuration'

export class Factory implements extensions.Factory {
  public aspect (locator: Locator, manifest: Manifest): extensions.Aspect {
    const value = get(locator, manifest)

    return new Aspect(value)
  }
}
