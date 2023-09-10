import { decode } from '@toa.io/generic'
import { Tenant } from './Tenant'
import { Gateway } from './Gateway'
import { Remotes } from './Remotes'
import { Tree, syntax } from './RTD'
import { Server } from './HTTP'
import { type Endpoint, EndpointFactory } from './Endpoint'
import * as directives from './directives'
import { type Directives, DirectivesFactory, type Family } from './Directive'
import { Composition } from './Composition'
import type { Connector, Locator, extensions } from '@toa.io/core'

export class Factory implements extensions.Factory {
  private readonly boot: Bootloader
  private readonly families: Family[]

  public constructor (boot: Bootloader) {
    this.boot = boot
    this.families = directives.load()
  }

  public tenant (locator: Locator, manifest: syntax.Node): Connector {
    const broadcast = this.boot.bindings.broadcast(CHANNEL, locator.id)

    return new Tenant(broadcast, locator, manifest)
  }

  public service (name: string): Connector | null {
    if (name === 'gateway')
      return this.gateway()

    return null
  }

  private gateway (): Gateway {
    const broadcast = this.boot.bindings.broadcast(CHANNEL)
    const server = Server.create({ methods: syntax.verbs })
    const remotes = new Remotes(this.boot)
    const methods = new EndpointFactory(remotes)
    const directives = new DirectivesFactory(this.families, remotes)
    const root = resolveRoot()
    const tree = new Tree<Endpoint, Directives>(root, methods, directives)

    const composition = new Composition(this.boot)
    const gateway = new Gateway(broadcast, server, tree)

    gateway.depends(composition)

    return gateway
  }
}

export function resolveRoot (): syntax.Node {
  const value = process.env.TOA_EXPOSITION

  if (value === undefined) return syntax.createNode()
  else return decode<syntax.Node>(value)
}

const CHANNEL = 'exposition'

// eslint-disable-next-line @typescript-eslint/consistent-type-imports
export type Bootloader = typeof import('@toa.io/boot')
