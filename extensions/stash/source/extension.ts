import { Aspect } from './Aspect.js'
import { Connection } from './Connection.js'
import type { Locator } from '@toa.io/core'
import type { extensions } from '@toa.io/core/types'

export class Factory implements extensions.Factory {
  public aspect(locator: Locator): extensions.Aspect {
    const connection = new Connection(locator)

    return new Aspect(connection)
  }
}
