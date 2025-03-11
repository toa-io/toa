import { Composition } from './Composition'
import { Aspect } from './Aspect'
import type { Connector, extensions } from '@toa.io/core'

export class Factory implements extensions.Factory {
  private readonly boot: Bootloader

  public constructor (boot: Bootloader) {
    this.boot = boot
  }

  public aspect (): extensions.Aspect {
    return new Aspect(this.boot)
  }

  public service (): Connector {
    return new Composition(this.boot)
  }
}

// eslint-disable-next-line @typescript-eslint/consistent-type-imports
export type Bootloader = typeof import('@toa.io/boot')
