import { console } from 'openspan'
import { ClickHouse, ClickHouseError } from './Client.ts'
import * as ddl from './ddl.ts'
import { Refusal } from '../Provider.ts'
import type { Label, Provider, Result, Row, State, Summary, View } from '../Provider.ts'
import type { Credentials } from '../settings.ts'

/**
 * The log in ClickHouse: `events`, replaced by `id`, and `states`, by the `version` of an entity, both
 * read with `FINAL`. Queries run as `<database>_reader`, which provisioning creates with limits it
 * cannot lift; views are made by the writer from what the reader was let plan.
 */
export class ClickHouseProvider implements Provider {
  public readonly dialect = 'ClickHouse SQL; read `events` and `states` with FINAL'
  public readonly tables = ddl.TABLES

  private readonly writer: ClickHouse
  private readonly reader: ClickHouse
  private readonly password: string
  private readonly retention: number | undefined

  public constructor(url: string, credentials: Credentials, retention?: number) {
    this.writer = new ClickHouse(url, credentials.username, credentials.password)
    this.reader = new ClickHouse(
      url,
      `${this.writer.database}_reader`,
      credentials.reader
    )
    this.password = credentials.reader
    this.retention = retention
  }

  public async provision(): Promise<void> {
    const { database } = this.writer

    for (const statement of ddl.database(database))
      await this.writer.run(statement, {}, '')

    await this.run(ddl.tables(this.retention))
    await this.run(ddl.retention(this.retention, await this.engine()))
    await this.run(ddl.reader(database, this.password))

    console.info('Chronicles provisioned', { database })
  }

  public async write(rows: Row[], states: State[]): Promise<void> {
    if (rows.length > 0) await this.insert('events', EVENTS, rows)
    if (states.length > 0) await this.insert('states', STATES, states)
  }

  public async states(): Promise<Summary[]> {
    return await this.writer.rows<Summary>(
      `SELECT component, uniqExact(entity) AS entities,
        arraySort(groupUniqArrayArray(JSONAllPaths(payload))) AS paths
      FROM states GROUP BY component ORDER BY component`
    )
  }

  public async labels(): Promise<Label[]> {
    const labels = await this.writer.rows<Label>(
      `SELECT label, count() AS rows, toString(min(time)) AS first, toString(max(time)) AS last
      FROM events GROUP BY label ORDER BY label`
    )

    // the fields of the latest payloads of each label, which is what a query is written against
    const paths = await this.writer.rows<{ label: string; paths: string[] }>(
      `SELECT label, arraySort(groupUniqArrayArray(JSONAllPaths(payload))) AS paths
      FROM (SELECT label, payload FROM events ORDER BY time DESC LIMIT ${SAMPLE} BY label)
      GROUP BY label`
    )

    const byLabel = new Map(paths.map(({ label, paths }) => [label, paths]))

    return labels.map((label) => ({ ...label, paths: byLabel.get(label.label) ?? [] }))
  }

  /**
   * One row more than is answered, cut by the `limit` setting — the result's own, outside whatever
   * the statement says — so a result of the limit exactly reads as whole, and one past it as cut.
   */
  public async query(sql: string): Promise<Result> {
    const settings = { ...NUMBERS, limit: String(ddl.LIMITS.rows + 1) }
    const answer = await refusing(async () => await this.reader.select(sql, settings))

    return {
      columns: answer.meta,
      rows: answer.data.slice(0, ddl.LIMITS.rows),
      truncated: answer.data.length > ddl.LIMITS.rows
    }
  }

  // parsed and planned as the reader, which is what refuses a view that reads what a query
  // could not
  public async validate(sql: string): Promise<void> {
    await refusing(async () => {
      const [ast] = await this.reader.rows<{ explain: string }>(`EXPLAIN AST ${sql}`)

      if (!ast.explain.startsWith('SelectWithUnionQuery'))
        throw new Refusal('A view is one SELECT')

      await this.reader.run(`EXPLAIN PLAN ${sql}`)
    })
  }

  public async views(): Promise<View[]> {
    const tables = await this.writer.rows<Table>(
      `SELECT name, as_select, create_table_query FROM system.tables
      WHERE database = currentDatabase()
        AND name NOT IN (${this.tables.map(ddl.literal).join(', ')})
        AND NOT startsWith(name, '.inner')
      ORDER BY name`
    )

    return tables.map((table) => {
      const view: View = { name: table.name, sql: table.as_select }

      // stated in seconds, and kept in the largest unit that divides them
      const every = /REFRESH EVERY (\d+) (SECOND|MINUTE|HOUR|DAY|WEEK)/.exec(
        table.create_table_query
      )

      if (every !== null) view.refresh = Number(every[1]) * UNITS[every[2]]

      return view
    })
  }

  public async define(name: string, sql: string, refresh?: number): Promise<void> {
    await this.writer.run(`DROP TABLE IF EXISTS ${ddl.id(name)} SYNC`)

    await refusing(async () => {
      if (refresh === undefined)
        await this.writer.run(
          `CREATE VIEW ${ddl.id(name)} SQL SECURITY INVOKER AS ${sql}`
        )
      else
        await this.writer.run(
          `CREATE MATERIALIZED VIEW ${ddl.id(name)} REFRESH EVERY ${refresh} SECOND
          ENGINE = MergeTree ORDER BY tuple() AS ${sql}`
        )
    })
  }

  public async drop(name: string): Promise<void> {
    await this.writer.run(`DROP TABLE IF EXISTS ${ddl.id(name)} SYNC`)
  }

  private async insert(
    table: string,
    columns: string,
    rows: Array<Row | State>
  ): Promise<void> {
    const lines = rows.map((row) => JSON.stringify({ ...row, time: timestamp(row.time) }))

    await this.writer.run(
      `INSERT INTO ${table} (${columns}) FORMAT JSONEachRow\n${lines.join('\n')}`
    )
  }

  /** In order, each awaited: a view is made after the table it reads. */
  private async run(statements: string[]): Promise<void> {
    for (const statement of statements) await this.writer.run(statement)
  }

  private async engine(): Promise<string> {
    const [table] = await this.writer.rows<{ engine_full: string }>(
      "SELECT engine_full FROM system.tables WHERE database = currentDatabase() AND name = 'events'"
    )

    return table?.engine_full ?? ''
  }
}

/** What ClickHouse refused is the provider's refusal, in ClickHouse's words. */
async function refusing<T>(fn: () => Promise<T>): Promise<T> {
  try {
    return await fn()
  } catch (exception) {
    if (exception instanceof ClickHouseError) throw new Refusal(exception.message)

    throw exception
  }
}

/** A `DateTime64(3)` as ClickHouse reads one without guessing: UTC, to the millisecond. */
function timestamp(ms: number): string {
  return new Date(ms).toISOString().replace('T', ' ').replace('Z', '')
}

interface Table {
  name: string
  as_select: string
  create_table_query: string
}

const EVENTS =
  'id, label, component, time, entity, version, identity, ip, country, trace, payload'
const STATES = 'component, entity, version, identity, time, payload'

const UNITS: Record<string, number> = {
  SECOND: 1,
  MINUTE: 60,
  HOUR: 3600,
  DAY: 86400,
  WEEK: 604800
}

const SAMPLE = 1000
const NUMBERS = { output_format_json_quote_64bit_integers: '0' }
