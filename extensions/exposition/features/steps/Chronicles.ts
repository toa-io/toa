import * as assert from 'node:assert'
import { load as parse } from 'js-yaml'
import { after, binding, given, then } from 'specumber'
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
      `DROP DATABASE IF EXISTS \`${DATABASE}\` SYNC`,
      `DROP USER IF EXISTS \`${DATABASE}_reader\``,
      `DROP SETTINGS PROFILE IF EXISTS \`${DATABASE}_reader\``
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

  /** For what the store writes on its own schedule: the scribe batches what arrives. */
  @then('the chronicles answer {string} within {int} second(s):')
  public async answer(sql: string, seconds: number, yaml: string): Promise<void> {
    const expected = parse(yaml)
    const deadline = Date.now() + seconds * 1000
    let rows: unknown = undefined

    while (Date.now() < deadline) {
      rows = await query(sql)

      if (JSON.stringify(rows) === JSON.stringify(expected)) return

      await new Promise((resolve) => setTimeout(resolve, 250))
    }

    assert.deepStrictEqual(rows, expected)
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

async function query(sql: string): Promise<unknown> {
  const response = await fetch(`${CLICKHOUSE}?database=${DATABASE}&default_format=JSON`, {
    method: 'POST',
    headers: { 'x-clickhouse-user': 'developer', 'x-clickhouse-key': 'secret' },
    body: sql
  })

  const text = await response.text()

  if (!response.ok) throw new Error(`ClickHouse answered ${response.status}: ${text}`)

  return (JSON.parse(text) as { data: unknown }).data
}

// the scope of a process under `TOA_DEV`, which the database of the log is named after
const DATABASE = 'toa-dev'
const CLICKHOUSE = 'http://localhost:31030/'
