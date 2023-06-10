import { Tenant } from './Tenant'
import type { Connector, Locator, extensions } from '@toa.io/core'
import type { Node } from './RTD/syntax'

export class Factory implements extensions.Factory {
  private readonly boot: bootloader

  public constructor (boot: bootloader) {
    this.boot = boot
  }

  public tenant (locator: Locator, branch: Node): Connector {
    const broadcast = this.boot.bindings.broadcast('@toa.io/bindings.amqp', 'exposition', locator.id)

    return new Tenant(broadcast, locator, branch)
  }
}

// eslint-disable-next-line @typescript-eslint/consistent-type-imports
type bootloader = typeof import('@toa.io/boot')
