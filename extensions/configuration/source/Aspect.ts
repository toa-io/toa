import { console } from 'openspan'
import { Connector, type Locator, type extensions } from '@toa.io/core'
import { fit, local, type Node } from './configuration'
import { epoch } from './epoch'
import type { Client } from './Client'
import type { Manifest } from './manifest'

export class Aspect extends Connector implements extensions.Aspect {
  public readonly name = 'configuration'

  private readonly locator: Locator
  private readonly manifest: Manifest
  private readonly client: Client | null
  private readonly epoch: string
  private value: Node = {}

  /**
   * Without a client the value is local: the variable, the defaults and the schema.
   * With one, the value is what the service holds, and it follows the service.
   */
  public constructor (locator: Locator, manifest: Manifest, client: Client | null) {
    super()

    this.locator = locator
    this.manifest = manifest
    this.client = client
    this.epoch = epoch(manifest.schema)

    if (client !== null)
      this.depends(client)
  }

  public invoke (path?: string[]): any {
    let cursor: any = this.value

    if (path !== undefined)
      for (const segment of path)
        cursor = cursor[segment]

    return cursor
  }

  protected override async open (): Promise<void> {
    if (this.client === null) {
      this.value = local(this.locator, this.manifest)

      return
    }

    const raw = await this.client.fetch(this.locator.id, this.epoch)

    this.value = fit(raw!, this.manifest)
    this.client.subscribe(this.locator.id, this.epoch, this.listener)
  }

  protected override async close (): Promise<void> {
    this.client?.unsubscribe(this.locator.id, this.epoch, this.listener)
  }

  private readonly listener = (raw: object): void => {
    try {
      this.value = fit(raw, this.manifest)

      console.info('Configuration updated', { component: this.locator.id })
    } catch (error) {
      // the service validated it against the schema of its epoch, so this is drift between the two
      console.error('Configuration update rejected', { component: this.locator.id, error })
    }
  }
}
