import { Tenant } from './Tenant'
import { Gateway } from './Gateway'
import { Remotes } from './Remotes'
import { Tree, syntax } from './RTD'
import { Server } from './HTTP'
import { type Endpoint, EndpointsFactory } from './Endpoint'
import * as directives from './directives'
import { type Directives, DirectivesFactory, type Family } from './Directive'
import { Composition } from './Composition'
import * as root from './root'
import type { Connector, Locator, extensions } from '@toa.io/core'

export class Factory implements extensions.Factory {
  private readonly boot: Bootloader
  private readonly families: Family[]

  public constructor (boot: Bootloader) {
    this.boot = boot
    this.families = directives.families
  }

  public tenant (locator: Locator, manifest: syntax.Node): Connector {
    const broadcast = this.boot.bindings.broadcast(CHANNEL, locator.id)

    return new Tenant(broadcast, locator, manifest)
  }

  public service (): Connector | null {
    const debug = process.env.TOA_EXPOSITION_DEBUG === '1'
    const broadcast = this.boot.bindings.broadcast(CHANNEL)
    const server = Server.create({ methods: syntax.verbs, debug })
    const remotes = new Remotes(this.boot)
    const node = root.resolve()
    const methods = new EndpointsFactory(remotes)
    const directives = new DirectivesFactory(this.families, remotes)
    const tree = new Tree<Endpoint, Directives>(node, methods, directives)

    const composition = new Composition(this.boot)
    const gateway = new Gateway(broadcast, server, tree)

    gateway.depends(remotes)
    gateway.depends(composition)

    return gateway
  }
}

const CHANNEL = 'exposition'

// eslint-disable-next-line @typescript-eslint/consistent-type-imports
export type Bootloader = typeof import('@toa.io/boot')
