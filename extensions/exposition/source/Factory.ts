import { Tenant } from './Tenant'

export class Factory implements extensions.Factory {
  private boot: boot

  constructor (boot: boot) {
    this.boot = boot
  }

  tenant (locator: Locator, branch: Node): Connector {
    const broadcast = this.boot.bindings.broadcast('@toa.io/bindings.amqp', 'exposition', locator.id)

    return new Tenant(broadcast, locator, branch)
  }
}

import type { Connector, Locator, extensions } from '@toa.io/core'
import type { Node } from './RTD/syntax'

type boot = typeof import('@toa.io/boot')
