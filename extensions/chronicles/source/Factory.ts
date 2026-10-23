import { INGEST, NAMESPACE, QUERY } from '@toa.io/definitions/extensions.chronicles'
import { Channel } from './Channel.ts'
import { ClickHouse } from './ClickHouse.ts'
import { Client } from './Client.ts'
import { Destination } from './Destination.ts'
import { Reader } from './Reader.ts'
import { Scribe } from './Scribe.ts'
import { Sender } from './Sender.ts'
import { credentials, settings } from './settings.ts'
import type { Connector, Locator } from '@toa.io/core'
import type { Declaration } from '@toa.io/definitions/extensions.chronicles'
import type { extensions } from '@toa.io/core/types'

/**
 * A component's changes go to the log through the outbox, as another of its destinations; what
 * it sends, it sends through the same channel. The components this extension ships are given
 * what they serve instead: the query, the log's reader; the client route, a sender of what
 * browsers send.
 */
export class Factory implements extensions.Factory {
  private readonly host: extensions.Host

  /** one publisher for the process, however many components send through it */
  private readonly channel: Channel

  public constructor(host: extensions.Host) {
    this.host = host
    this.channel = new Channel(host)
  }

  public destination(
    locator: Locator,
    labels: Declaration | null
  ): Destination | undefined {
    if (mine(locator) || labels === null || labels.length === 0) return undefined

    return new Destination(locator, labels, this.channel)
  }

  public aspect(locator: Locator): extensions.Aspect {
    if (mine(locator) && locator.name === QUERY) {
      const { clickhouse } = settings()
      const { username, password, reader } = credentials()
      const writer = new ClickHouse(clickhouse.url, username, password)

      return new Reader(
        writer,
        new ClickHouse(clickhouse.url, `${writer.database}_reader`, reader)
      )
    }

    if (mine(locator) && locator.name === INGEST) return new Client(this.channel)

    return new Sender(locator, this.channel)
  }

  // nothing connects to this, so a halt takes the whole of it
  public service(): Connector {
    return this.host.gate(async () => {
      const declared = settings()
      const { username, password, reader } = credentials()
      const writer = new ClickHouse(declared.clickhouse.url, username, password)

      return new Scribe(this.host, this.channel, writer, declared, reader)
    })
  }
}

/** Whether this is a component the extension ships rather than one of the application's. */
function mine(locator: Locator): boolean {
  return locator.namespace === NAMESPACE
}
