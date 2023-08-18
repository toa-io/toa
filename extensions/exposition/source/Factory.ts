import { Tenant } from './Tenant'
import { Gateway } from './Gateway'
import { Remotes } from './Remotes'
import { Tree } from './RTD'
import { Server } from './HTTP'
import { methods, type Node } from './RTD/syntax'
import type { Connector, Locator, extensions } from '@toa.io/core'

export class Factory implements extensions.Factory {
  private readonly boot: Bootloader

  public constructor (boot: Bootloader) {
    this.boot = boot
  }

  public tenant (locator: Locator, node: Node): Connector {
    const broadcast = this.boot.bindings.broadcast(CHANNEL, locator.id)

    return new Tenant(broadcast, locator, node)
  }

  public service (name: string): Connector | null {
    if (name === 'gateway') return this.gateway()

    return null
  }

  private gateway (): Gateway {
    const broadcast = this.boot.bindings.broadcast(CHANNEL)
    const server = Server.create({ methods })
    const remotes = new Remotes(this.boot)
    const tree = new Tree({}, remotes)

    return new Gateway(broadcast, server, tree)
  }
}

const CHANNEL = 'exposition'

// eslint-disable-next-line @typescript-eslint/consistent-type-imports
export type Bootloader = typeof import('@toa.io/boot')
