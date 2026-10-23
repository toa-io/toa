import { after, binding, given } from 'specumber'
import * as boot from '@toa.io/boot'
import { Factory } from '@toa.io/extensions.chronicles'
import { Gateway } from './Gateway.ts'
import { exposed } from './exposed.ts'
import type { Connector } from '@toa.io/core'

/** The chronicles service, as its extension runs it, behind the gateway the suite runs. */
@binding([Gateway])
export class Chronicles {
  private readonly gateway: Gateway
  private service: Connector | null = null

  public constructor(gateway: Gateway) {
    this.gateway = gateway
  }

  // what the extension falls back to under `TOA_DEV`, started from nothing: a row a scenario
  // before wrote would be read by the next
  @given('the chronicles are empty')
  public async empty(): Promise<void> {
    for (const statement of [
      `DROP DATABASE IF EXISTS ${DATABASE} SYNC`,
      `DROP NAMED COLLECTION IF EXISTS chronicles_${DATABASE}`,
      `DROP USER IF EXISTS ${DATABASE}_reader`,
      `DROP SETTINGS PROFILE IF EXISTS ${DATABASE}_reader`
    ])
      await clickhouse(statement)
  }

  @given('the chronicles service is running')
  public async run(): Promise<void> {
    await this.gateway.start()

    const factory = new Factory(boot.host())
    const service = await factory.service()

    this.service = service

    await exposed(async () => await service.connect())
  }

  @after()
  public async shutdown(): Promise<void> {
    await this.service?.disconnect()

    this.service = null
  }
}

async function clickhouse(sql: string): Promise<void> {
  const response = await fetch(CLICKHOUSE, {
    method: 'POST',
    headers: { 'x-clickhouse-user': 'developer', 'x-clickhouse-key': 'secret' },
    body: sql
  })

  if (!response.ok)
    throw new Error(`ClickHouse answered ${response.status}: ${await response.text()}`)
}

const DATABASE = 'chronicles'
const CLICKHOUSE = 'http://localhost:31030/'
