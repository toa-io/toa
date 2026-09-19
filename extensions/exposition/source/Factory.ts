import { createHash } from 'node:crypto'
import { contract } from '@toa.io/core'
import { Announcements } from './Announcements.ts'
import { Tenant } from './Tenant.ts'
import { Realtime } from './realtime/Factory.ts'
import { CHANNEL } from '@toa.io/definitions/extensions.exposition'
import type { Branch } from './Branch.ts'
import type { syntax } from './RTD/index.ts'
import type { Connector, Contract, Locator } from '@toa.io/core'
import type { extensions } from '@toa.io/core/types'

export class Factory implements extensions.Factory {
  /** `realtime`, declared beside `exposition`: the routes of a component's events to streams */
  public readonly keys = { realtime: new Realtime() }

  private readonly host: Host
  private announcing: Promise<Announcements> | undefined
  private announcements: Announcements | undefined

  public constructor(host: Host) {
    this.host = host
  }

  public async tenant(
    locator: Locator,
    node: syntax.Node,
    manifest: Manifest
  ): Promise<Connector> {
    const announcements = await this.shared()
    const routes = createHash('sha256').update(JSON.stringify(node)).digest('hex')

    // no timestamp: the tenant stamps each announcement with its own start time
    const branch: Omit<Branch, 'timestamp'> = {
      // boot only ever hands a tenant a component's locator, which always has a namespace
      namespace: locator.namespace!,
      component: locator.name,
      isolated: locator.namespace === 'identity',
      node,
      version: manifest.version,
      contract: contract.component(manifest),
      routes
    }

    return new Tenant(announcements, branch)
  }

  /**
   * The announcements this process holds, made if there are none. A factory is loaded once and
   * outlives every composition it hands a tenant to, so what it remembers is replaced rather
   * than handed out again once it has been taken down.
   */
  private async shared(): Promise<Announcements> {
    if (this.announcements?.disposed === true) {
      this.announcing = undefined
      this.announcements = undefined
    }

    this.announcing ??= this.announce()

    return await this.announcing
  }

  private async announce(): Promise<Announcements> {
    const announcements = new Announcements(await this.host.broadcast(CHANNEL))

    this.announcements = announcements

    return announcements
  }

  public async service(): Promise<Connector | null> {
    const { service } = await import('./service.ts')

    return await service(this.host)
  }
}

// eslint-disable-next-line @typescript-eslint/consistent-type-imports
export type Host = extensions.Host

/** What a tenant reads of the component it announces: what it provides, and which version. */
type Manifest = Contract & { version: string }
