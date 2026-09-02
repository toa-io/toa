import { type Connector, type Locator, type extensions } from '@toa.io/core'
import { Aspect } from './Aspect'
import { Client } from './Client'
import { Composition } from './Composition'
import { overridden } from './configuration'
import type { Manifest } from './manifest'

export class Factory implements extensions.Factory {
  private readonly boot: Bootloader
  private client: Client | null = null

  public constructor (boot: Bootloader) {
    this.boot = boot
  }

  public aspect (locator: Locator, manifest: Manifest): extensions.Aspect {
    const client = overridden(locator) ? null : this.shared()

    return new Aspect(locator, manifest, client)
  }

  public service (): Connector {
    return new Composition(this.boot)
  }

  private shared (): Client {
    if (this.client === null || this.client.disposed)
      this.client = new Client(this.boot)

    return this.client
  }
}

// eslint-disable-next-line @typescript-eslint/consistent-type-imports
export type Bootloader = typeof import('@toa.io/boot')
