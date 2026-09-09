import { environment } from '@toa.io/generic'
import { resolve } from '@toa.io/pointer'
import {
  BINDING,
  BROKERS,
  CHANNEL,
  ID
} from '@toa.io/definitions/extensions.convergence'
import { Destination } from './Destination.js'
import { Converging } from './Storage.js'
import type { Locator } from '@toa.io/core'
import type { bindings, extensions, storages } from '@toa.io/core/types'

/**
 * Two contributions, and the whole of the extension. What a record says about the region that
 * wrote it, and the rule that reads it, are the runtime's; what a row is published to, and how
 * it is carried, are the outbox's and the binding's. This is what ties the three together.
 */
export class Factory implements extensions.Factory {
  private readonly host: extensions.Host

  /** one publisher for the process, however many components send through it */
  private outbound: Promise<bindings.Outbound> | undefined

  public constructor(host: extensions.Host) {
    this.host = host
  }

  /** out */
  public destination(
    locator: Locator,
    _: null,
    manifest: Manifest
  ): Destination | undefined {
    if (!converging() || manifest.entity === undefined) return undefined

    return new Destination(locator, async () => this.publisher())
  }

  /**
   * In. Guarded, because what decorates a storage is every extension loaded in the process
   * rather than the ones a manifest named: once anything here converges, this is asked about
   * everything. Convergence is a property of a deployment, so what it is deployed with is what
   * says whether there is any.
   */
  public storage(storage: storages.Storage, locator: Locator): storages.Storage {
    if (!converging()) return storage

    return new Converging(storage, locator, async (sink) =>
      this.host.inbound(this.binding(), CHANNEL, this.uris(), locator.id, sink)
    )
  }

  private async publisher(): Promise<bindings.Outbound> {
    this.outbound ??= this.host.outbound(this.binding(), CHANNEL, this.uris())

    return this.outbound
  }

  private binding(): string {
    const reference = environment.get(BINDING)

    if (reference === undefined)
      throw new Error(`${BINDING} is not set, so nothing says what carries the channel.`)

    return reference
  }

  private uris(): string[] {
    return resolve(ID, BROKERS)
  }
}

/** Whether this deployment converges at all, which is a thing it is deployed with or not. */
function converging(): boolean {
  return environment.get(BINDING) !== undefined
}

interface Manifest {
  entity?: object
}
