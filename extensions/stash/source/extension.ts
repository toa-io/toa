import { Aspect } from './Aspect'
import { Connection } from './Connection'
import type { Locator, extensions } from '@toa.io/core'

export class Factory implements extensions.Factory {
  private readonly boot: Bootloader

  public constructor (boot: Bootloader) {
    this.boot = boot
  }

  public aspect (locator: Locator): extensions.Aspect {
    const url = 'redis://localhost:6379'
    const connection = new Connection(url, locator)

    return new Aspect(connection)
  }
}

// eslint-disable-next-line @typescript-eslint/consistent-type-imports
export type Bootloader = typeof import('@toa.io/boot')
