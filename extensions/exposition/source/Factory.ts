import type { Connector, Locator, extensions } from '@toa.io/core'

import { Tenant } from './Tenant'

export class Factory implements extensions.Factory {
  tenant (locator: Locator, declaration: object): Connector {
    return new Tenant()
  }
}
