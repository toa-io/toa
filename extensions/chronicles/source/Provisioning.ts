import { console } from 'openspan'
import { Connector } from '@toa.io/core'
import * as ddl from './ddl.ts'
import { names } from './names.ts'
import { relay } from './settings.ts'
import type { Channel } from './Channel.ts'
import type { ClickHouse } from './ClickHouse.ts'
import type { Settings } from '@toa.io/definitions/extensions.chronicles'

/**
 * The log in ClickHouse, made what the annotation says before the service serves anything. The
 * queue comes first: ClickHouse consumes what the broker already holds for it, and a consumer of
 * a queue that does not exist yet consumes nothing.
 */
export class Provisioning extends Connector {
  private readonly channel: Channel
  private readonly writer: ClickHouse
  private readonly settings: Settings
  private readonly password: string

  // eslint-disable-next-line max-params
  public constructor(
    channel: Channel,
    writer: ClickHouse,
    settings: Settings,
    password: string
  ) {
    super()

    this.channel = channel
    this.writer = writer
    this.settings = settings
    this.password = password
  }

  protected override async open(): Promise<void> {
    const outbound = await this.channel.open()

    this.depends(outbound)

    const { database } = this.writer

    await this.run(ddl.database(database), '')
    await this.run(ddl.tables(this.settings.retention))
    await this.run(ddl.retention(this.settings.retention, await this.engine('events')))

    const consumer = ddl.consumer(database, relay(this.settings), names())

    if ((await this.comment('queue')) !== consumer.fingerprint) {
      await this.run(consumer.drop)
      await this.run(consumer.create)
    }

    await this.run(consumer.views)
    await this.run(ddl.reader(database, this.password))

    console.info('Chronicles provisioned', { database })
  }

  /** In order, each awaited: a view is made after the table it reads. */
  private async run(statements: string[], database?: string): Promise<void> {
    for (const statement of statements)
      if (database === undefined) await this.writer.run(statement)
      else await this.writer.run(statement, {}, database)
  }

  private async engine(table: string): Promise<string> {
    return (await this.table(table))?.engine_full ?? ''
  }

  private async comment(table: string): Promise<string | undefined> {
    return (await this.table(table))?.comment
  }

  private async table(name: string): Promise<Table | undefined> {
    const [table] = await this.writer.rows<Table>(
      `SELECT engine_full, comment FROM system.tables
      WHERE database = currentDatabase() AND name = ${ddl.literal(name)}`
    )

    return table
  }
}

interface Table {
  engine_full: string
  comment: string
}
