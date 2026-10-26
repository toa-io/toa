import * as assert from 'node:assert'
import { readFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import { dirname, join } from 'node:path'
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

  // the store of the development stack, set up as the extension's reference says and started from
  // nothing: a row a scenario before wrote would be read by the next
  @given('the chronicles are empty')
  public async empty(): Promise<void> {
    await clickhouse('DROP DATABASE IF EXISTS chronicles SYNC')
    await clickhouse(`DROP DATABASE IF EXISTS \`${SCOPE}\` SYNC`)
    await clickhouse(`DROP USER IF EXISTS \`${SCOPE}\``)
    await clickhouse(`DROP SETTINGS PROFILE IF EXISTS \`${SCOPE}\``)

    let sql = await readFile(join(SETUP, 'clickhouse.sql'), 'utf8')

    for (const [key, value] of Object.entries(BROKER))
      sql = sql.replaceAll(`{${key}}`, value)

    const statements = sql
      .split('\n')
      .filter((line) => !line.trimStart().startsWith('--'))
      .join('\n')
      .split(';')
      .map((statement) => statement.trim())
      .filter((statement) => statement !== '')

    for (const statement of statements) await clickhouse(statement)

    // the user of the process's scope, which it reads the log as
    let user = await readFile(join(SETUP, 'clickhouse.scope.sql'), 'utf8')

    user = user.replaceAll('{scope}', SCOPE).replaceAll('{password}', 'secret')

    for (const statement of user
      .split('\n')
      .filter((line) => !line.trimStart().startsWith('--'))
      .join('\n')
      .split(';')
      .map((statement) => statement.trim())
      .filter((statement) => statement !== ''))
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

// where the reference setup keeps the log
const DATABASE = 'chronicles'
const CLICKHOUSE = 'http://localhost:31030/'

// the scope of a process under `TOA_DEV`, which its views are kept under
const SCOPE = 'toa-dev'

// the development broker, as the store reaches it
const BROKER = {
  broker: 'rabbitmq:5672',
  broker_username: 'developer',
  broker_password: 'secret'
}

const SETUP = join(
  dirname(
    createRequire(import.meta.url).resolve('@toa.io/extensions.chronicles/package.json')
  ),
  'store'
)
