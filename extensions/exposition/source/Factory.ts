import { Tenant } from './Tenant'
import { Gateway } from './Gateway'
import { Remotes } from './Remotes'
import { Tree, syntax } from './RTD'
import { Server } from './HTTP'
import { type Endpoint, EndpointFactory } from './Endpoint'
import * as env from './annotation'
import type { Connector, Locator, extensions } from '@toa.io/core'

export class Factory implements extensions.Factory {
  private readonly boot: Bootloader

  public constructor (boot: Bootloader) {
    this.boot = boot
  }

  public tenant (locator: Locator, node: syntax.Node): Connector {
    const broadcast = this.boot.bindings.broadcast(CHANNEL, locator.id)

    return new Tenant(broadcast, locator, node)
  }

  public service (name: string): Connector | null {
    if (name === 'gateway') return this.gateway()

    return null
  }

  private gateway (): Gateway {
    const broadcast = this.boot.bindings.broadcast(CHANNEL)
    const server = Server.create({ methods: syntax.verbs })
    const remotes = new Remotes(this.boot)
    const methods = new EndpointFactory(remotes)
    const annotation: syntax.Node = env.resolve()
    const tree = new Tree<Endpoint>(annotation, methods)

    return new Gateway(broadcast, server, tree)
  }
}

const CHANNEL = 'exposition'

// eslint-disable-next-line @typescript-eslint/consistent-type-imports
export type Bootloader = typeof import('@toa.io/boot')
