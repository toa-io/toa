import { Tenant } from './Tenant'
import { Gateway } from './Gateway'
import { Remotes } from './Remotes'
import { Tree } from './RTD/Tree'
import { Server } from './HTTP'
import type { Connector, Locator, extensions } from '@toa.io/core'
import type { Node } from './RTD/syntax'

export class Factory implements extensions.Factory {
  private readonly boot: Bootloader

  public constructor (boot: Bootloader) {
    this.boot = boot
  }

  public tenant (locator: Locator, branch: Node): Connector {
    const broadcast = this.boot.bindings.broadcast(CHANNEL, locator.id)

    return new Tenant(broadcast, locator, branch)
  }

  public service (name: string): Connector | null {
    if (name === 'gateway') return this.gateway()

    return null
  }

  private gateway (): Gateway {
    const broadcast = this.boot.bindings.broadcast(CHANNEL)
    const server = Server.create()
    const remotes = new Remotes(this.boot)
    const tree = new Tree({}, remotes)

    return new Gateway(broadcast, server, tree)
  }
}

const CHANNEL = 'exposition'

// eslint-disable-next-line @typescript-eslint/consistent-type-imports
export type Bootloader = typeof import('@toa.io/boot')
