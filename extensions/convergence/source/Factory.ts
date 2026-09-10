import { console } from 'openspan'
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

  /**
   * What this extension was given, by component, until the storage of that component is made.
   * What decorates a storage is every extension loaded in the process rather than the ones a
   * manifest named, so this is what tells a component this extension converges from one it was
   * never asked about — one that stores nothing, or one of another composition entirely.
   */
  private readonly destinations = new Map<string, Destination>()

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

    const destination = new Destination(locator, async () => this.publisher())

    this.destinations.set(locator.id, destination)

    return destination
  }

  /** in, for the components this extension was given and no others */
  public storage(storage: storages.Storage, locator: Locator): storages.Storage {
    const destination = this.destinations.get(locator.id)

    // the pairing is for the component being built, and one is built once: an extension is
    // loaded once for the life of a process, and holding a component's id past its build
    // would decorate the next one to carry that id
    this.destinations.delete(locator.id)

    if (destination === undefined || !converging()) return storage

    /*
     * A storage that does not converge has nowhere to put what another region wrote, so
     * neither does this component — and the half that publishes stands down with it, because
     * what it sent would reach a queue no region declares. Said out loud, because a component
     * silently not converging is two regions differing with nothing to notice it.
     */
    if (storage.converges !== true) {
      destination.disable()

      console.warn('Component does not converge: its storage cannot', {
        component: locator.id
      })

      return storage
    }

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
