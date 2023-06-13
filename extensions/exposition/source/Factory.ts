import { Tenant } from './Tenant'
import { Gateway } from './Gateway'
import type { Connector, Locator, extensions } from '@toa.io/core'
import type { Node } from './RTD/syntax'

export class Factory implements extensions.Factory {
  private readonly boot: Bootloader

  public constructor (boot: Bootloader) {
    this.boot = boot
  }

  public tenant (locator: Locator, branch: Node): Connector {
    const broadcast = this.boot.bindings.broadcast('@toa.io/bindings.amqp', 'exposition', locator.id)

    return new Tenant(broadcast, locator, branch)
  }

  public service (name: string): Connector | null {
    if (name === 'gateway') return this.gateway()

    return null
  }

  private gateway (): Gateway {
    return new Gateway()
  }
}

// eslint-disable-next-line @typescript-eslint/consistent-type-imports
type Bootloader = typeof import('@toa.io/boot')
