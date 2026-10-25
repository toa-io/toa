import { environment } from '@toa.io/generic'
import {
  ENCOUNTERS,
  NAMESPACE,
  QUERIES,
  RELAY
} from '@toa.io/definitions/extensions.chronicles'
import { Client } from './Client.ts'
import { Publisher } from './Publisher.ts'
import { Reader } from './Reader.ts'
import { Relay } from './Relay.ts'
import { Sender } from './Sender.ts'
import { Service } from './Service.ts'
import { credentials, settings } from './settings.ts'
import { provider } from './store.ts'
import type { Provider } from './Provider.ts'
import type { Connector, Locator } from '@toa.io/core'
import type { extensions } from '@toa.io/core/types'
import type { Declaration } from '@toa.io/definitions/extensions.chronicles'

/**
 * A component sends facts through its context; the events it declares reach the log as events of
 * the context, which the service consumes. The components this extension ships are given what
 * they serve instead: the queries, the store; the relay, the publisher; the encounters, the relay.
 */
export class Factory implements extensions.Factory {
  private readonly host: extensions.Host

  /** the publisher of the service running, which the relay it runs publishes through */
  private publisher: Publisher | undefined

  /** one store for the process, made where the process is one that reads it */
  private store: Provider | undefined

  public constructor(host: extensions.Host) {
    this.host = host
  }

  public aspect(locator: Locator, declaration?: Declaration): extensions.Aspect {
    if (mine(locator))
      switch (locator.name) {
        case QUERIES:
          return new Reader(this.host, () => this.read(), settings)
        case RELAY:
          return new Relay(this.publish())
        case ENCOUNTERS:
          return new Client(this.host, () => settings().ip)
      }

    return new Sender(this.host, locator, declaration?.facts ?? {})
  }

  // nothing connects to this, so a halt takes the whole of it
  public service(): Connector {
    return this.host.gate(async () => new Service(this.host, settings(), this.publish()))
  }

  /**
   * The publisher of the settings there are, made anew where they have changed or the one there was
   * has stopped with its service.
   */
  private publish(): Publisher {
    const { broker, retention } = settings()

    if (
      this.publisher === undefined ||
      this.publisher.done ||
      this.publisher.address !== broker
    )
      this.publisher = new Publisher(
        broker,
        credentials().broker,
        environment.scope(),
        retention
      )

    return this.publisher
  }

  private read(): Provider {
    this.store ??= provider(settings(), credentials().store, environment.scope())

    return this.store
  }
}

/** Whether this is a component the extension ships rather than one of the application's. */
function mine(locator: Locator): boolean {
  return locator.namespace === NAMESPACE
}
