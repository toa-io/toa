import { Tenant } from './Tenant'
import { Gateway } from './Gateway'
import { Remotes } from './Remotes'
import { Tree, syntax } from './RTD'
import { Server } from './HTTP'
import { EndpointsFactory } from './Endpoint'
import { families, interceptors } from './directives'
import { DirectivesFactory } from './Directive'
import { Composition } from './Composition'
import * as root from './root'
import { Interception } from './Interception'
import type { Broadcast } from './Gateway'
import type { Connector, Locator, extensions } from '@toa.io/core'

export class Factory implements extensions.Factory {
  private readonly boot: Bootloader

  public constructor (boot: Bootloader) {
    this.boot = boot
  }

  public tenant (locator: Locator, node: syntax.Node): Connector {
    const broadcast: Broadcast = this.boot.bindings.broadcast(CHANNEL, locator.id)

    return new Tenant(broadcast, locator, node)
  }

  public service (): Connector | null {
    const debug = process.env.TOA_EXPOSITION_DEBUG === '1'
    const trace = process.env.TOA_EXPOSITION_TRACE === '1'
    const broadcast: Broadcast = this.boot.bindings.broadcast(CHANNEL)

    const server = Server.create({
      methods: syntax.verbs,
      debug,
      trace
    })

    const remotes = new Remotes(this.boot)
    const node = root.resolve()
    const methods = new EndpointsFactory(remotes)
    const directives = new DirectivesFactory(families, remotes)
    const interception = new Interception(interceptors)
    const tree = new Tree(node, methods, directives)

    const composition = new Composition(this.boot)
    const gateway = new Gateway(broadcast, tree, interception)

    gateway.depends(remotes)
    gateway.depends(composition)

    server.attach(gateway.process.bind(gateway))
    server.depends(gateway)

    return server
  }
}

const CHANNEL = 'exposition'

// eslint-disable-next-line @typescript-eslint/consistent-type-imports
export type Bootloader = typeof import('@toa.io/boot')
