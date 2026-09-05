import { type Component, Locator } from '@toa.io/core'
import type { extensions } from '@toa.io/core/types'
import { Realtime } from './Realtime.js'
import { Composition } from './Composition.js'
import { Routes } from './Routes.js'

export class Factory implements extensions.Factory {
  private readonly host: Host

  public constructor (host: Host) {
    this.host = host
  }

  public service (): Realtime {
    const routes = new Routes(this.host)
    const composition = new Composition(this.host)
    const realtime = new Realtime(routes, async () => await this.discovery())

    realtime.depends(routes)
    realtime.depends(composition)

    return realtime
  }

  private async discovery (): Promise<Component> {
    const locator = new Locator('streams', 'realtime')

    return await this.host.remote(locator, { service: 'realtime' })
  }
}

export type Host = extensions.Host
