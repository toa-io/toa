import {
  ENCOUNTERS,
  FACTS,
  NAMESPACE,
  QUERIES
} from '@toa.io/definitions/extensions.chronicles'
import { Client } from './Client.ts'
import { Facts } from './Facts.ts'
import { Reader } from './Reader.ts'
import { Scribe } from './Scribe.ts'
import { Sender } from './Sender.ts'
import { Writer } from './Writer.ts'
import { credentials, settings } from './settings.ts'
import { provider } from './store.ts'
import type { Provider } from './Provider.ts'
import type { Connector, Locator } from '@toa.io/core'
import type { extensions } from '@toa.io/core/types'
import type { Declaration } from '@toa.io/definitions/extensions.chronicles'

/**
 * A component sends facts through its context; the events it declares reach the log as events of
 * the context, which the service consumes. The components this extension ships are given what
 * they serve instead: the queries, the provider and what is declared; the facts and the
 * encounters, the writer.
 */
export class Factory implements extensions.Factory {
  private readonly host: extensions.Host

  /** one store and one writer for the process, made where the process is one that keeps the log */
  private store: { provider: Provider; writer: Writer } | undefined

  public constructor(host: extensions.Host) {
    this.host = host
  }

  public aspect(locator: Locator, declaration?: Declaration): extensions.Aspect {
    if (mine(locator))
      switch (locator.name) {
        case QUERIES:
          return new Reader(this.host, () => this.keep().provider, settings)
        case FACTS:
          return new Facts(() => this.keep().writer)
        case ENCOUNTERS:
          return new Client(
            () => this.keep().writer,
            () => settings().ip
          )
      }

    return new Sender(this.host, locator, declaration?.facts ?? {})
  }

  // nothing connects to this, so a halt takes the whole of it
  public service(): Connector {
    return this.host.gate(async () => {
      const { provider, writer } = this.keep()

      return new Scribe(this.host, settings(), provider, writer)
    })
  }

  private keep(): { provider: Provider; writer: Writer } {
    if (this.store === undefined) {
      const store = provider(settings(), credentials())

      this.store = { provider: store, writer: new Writer(store) }
    }

    return this.store
  }
}

/** Whether this is a component the extension ships rather than one of the application's. */
function mine(locator: Locator): boolean {
  return locator.namespace === NAMESPACE
}
