import { type Connector, type Locator } from '@toa.io/core'
import type { extensions } from '@toa.io/core/types'
import { Aspect } from './Aspect.ts'
import { Client } from './Client.ts'
import { Composition } from './Composition.ts'
import { overridden } from './configuration.ts'
import type { Manifest } from '@toa.io/definitions/extensions.configuration'

export class Factory implements extensions.Factory {
  private readonly host: Host
  private client: Client | null = null

  public constructor(host: Host) {
    this.host = host
  }

  public aspect(locator: Locator, manifest: Manifest): extensions.Aspect {
    const client = overridden(locator) ? null : this.shared()

    return new Aspect(locator, manifest, client)
  }

  public service(): Connector {
    return new Composition(this.host)
  }

  private shared(): Client {
    if (this.client === null || this.client.disposed) this.client = new Client(this.host)

    return this.client
  }
}

export type Host = extensions.Host
