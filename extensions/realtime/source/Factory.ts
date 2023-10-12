import { type Component, type extensions, Locator } from '@toa.io/core'
import { Realtime } from './Realtime'
import { Composition } from './Composition'
import { Routes } from './Routes'

export class Factory implements extensions.Factory {
  private readonly boot: Bootloader

  public constructor (boot: Bootloader) {
    this.boot = boot
  }

  public service (): Realtime {
    const discovery = this.discovery()
    const routes = new Routes(this.boot)
    const composition = new Composition(this.boot)
    const realtime = new Realtime(routes, discovery)

    realtime.depends(routes)
    realtime.depends(composition)

    return realtime
  }

  private async discovery (): Promise<Component> {
    const locator = new Locator('streams', 'realtime')

    return await this.boot.remote(locator)
  }
}

// eslint-disable-next-line @typescript-eslint/consistent-type-imports
export type Bootloader = typeof import('@toa.io/boot')
