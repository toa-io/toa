import assert from 'node:assert'
import { decode } from '@toa.io/generic'
import { Tenant } from './Tenant'
import { Gateway } from './Gateway'
import { Remotes } from './Remotes'
import { Tree } from './RTD'
import { EndpointsFactory } from './Endpoint'
import { families, interceptors } from './directives'
import { DirectivesFactory } from './Directive'
import { Composition } from './Composition'
import * as root from './root'
import { Interception } from './Interception'
import * as http from './HTTP'
import type { syntax } from './RTD'
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
    assert.ok(process.env.TOA_EXPOSITION_PROPERTIES,
      'TOA_EXPOSITION_PROPERTIES is undefined')

    const options = decode<http.Options>(process.env.TOA_EXPOSITION_PROPERTIES)
    const broadcast: Broadcast = this.boot.bindings.broadcast(CHANNEL)
    const server = http.Server.create({ ...options })
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
