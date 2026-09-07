import { createHash } from 'node:crypto'
import { Tenant } from './Tenant.js'
import { CHANNEL } from '@toa.io/definitions/extensions.exposition'
import type { Branch } from './Branch.js'
import type { syntax } from './RTD/index.js'
import type { Broadcast } from './Gateway.js'
import type { Connector, Locator } from '@toa.io/core'
import type { extensions } from '@toa.io/core/types'

export class Factory implements extensions.Factory {
  private readonly host: Host

  public constructor(host: Host) {
    this.host = host
  }

  public async tenant(locator: Locator, node: syntax.Node): Promise<Connector> {
    const broadcast: Broadcast = await this.host.broadcast(CHANNEL, locator.id)
    const hash = createHash('sha256').update(JSON.stringify(node)).digest('hex')

    // no timestamp: the tenant stamps each announcement with its own start time
    const branch: Omit<Branch, 'timestamp'> = {
      // boot only ever hands a tenant a component's locator, which always has a namespace
      namespace: locator.namespace!,
      component: locator.name,
      isolated: locator.namespace === 'identity',
      node,
      version: hash
    }

    return new Tenant(broadcast, branch)
  }

  public async service(): Promise<Connector | null> {
    const { service } = await import('./service.js')

    return await service(this.host)
  }
}

// eslint-disable-next-line @typescript-eslint/consistent-type-imports
export type Host = extensions.Host
