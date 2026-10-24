import { console } from 'openspan'
import { ClickHouse, ClickHouseError } from './Client.ts'
import { view } from '@toa.io/definitions/extensions.chronicles'
import * as ddl from './ddl.ts'
import * as views from './views.ts'
import { Refusal } from '../Provider.ts'
import type {
  Declared,
  Definition,
  Encounter,
  Encountered,
  Field,
  Label,
  Provider,
  Result,
  Row,
  State,
  Summary,
  View
} from '../Provider.ts'
import type { Credentials } from '../settings.ts'
import type { Property } from '@toa.io/definitions/extensions.chronicles'

/**
 * The log in ClickHouse: `events` and `encounters`, replaced by `id`, and `states`, by the `version`
 * of an entity, all read with `FINAL`. Queries run as `<database>_reader`, which provisioning creates
 * with limits it cannot lift; views are made by the writer from what the reader was let plan.
 *
 * A view says what it is in its comment, as JSON: the `title` and the `description` it was defined
 * with, or the label it is the view of, which is how the views of what is declared are told from
 * the rest.
 */
export class ClickHouseProvider implements Provider {
  public readonly dialect =
    'ClickHouse SQL; read `events`, `states` and `encounters` with FINAL'
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

    for (const [table, column] of ddl.EXPIRING)
      await this.run(
        ddl.retention(this.retention, await this.engine(table), table, column)
      )

    await this.run(ddl.reader(database, this.password))

    console.info('Chronicles provisioned', { database })
  }

  public async write(
    rows: Row[],
    states: State[],
    encounters: Encounter[]
  ): Promise<void> {
    if (rows.length > 0) await this.insert('events', EVENTS, rows)
    if (states.length > 0) await this.insert('states', STATES, states)
    if (encounters.length > 0) await this.insert('encounters', ENCOUNTERS, encounters)
  }

  /** Each replaced in place, so a reader is never without one; then what is no longer declared. */
  public async declare(declarations: Declared[]): Promise<void> {
    const names = new Set<string>()

    for (const declared of declarations) {
      const of = declared.kind === 'state' ? declared.component : declared.label
      const name = view(of)

      names.add(name)

      await this.writer.run(
        `CREATE OR REPLACE VIEW ${ddl.id(name)} SQL SECURITY INVOKER AS ${views.select(declared)}
        COMMENT ${ddl.literal(JSON.stringify({ declared: of }))}`
      )
    }

    for (const table of await this.listed())
      if (said(table.comment).declared !== undefined && !names.has(table.name))
        await this.writer.run(`DROP VIEW IF EXISTS ${ddl.id(table.name)} SYNC`)
  }

  public fields(properties: Record<string, Property>): Field[] {
    return views.fields(properties)
  }

  public async states(): Promise<Summary[]> {
    return await this.writer.rows<Summary>(
      `SELECT component, uniqExact(entity) AS entities, toString(max(received)) AS received
      FROM states GROUP BY component ORDER BY component`
    )
  }

  public async labels(): Promise<Label[]> {
    return await this.writer.rows<Label>(
      `SELECT label, count() AS rows, toString(min(time)) AS first, toString(max(time)) AS last,
        toString(max(received)) AS received
      FROM events GROUP BY label ORDER BY label`
    )
  }

  public async encounters(): Promise<Encountered[]> {
    const names = await this.writer.rows<Omit<Encountered, 'fields'>>(
      `SELECT name, count() AS rows, toString(min(time)) AS first, toString(max(time)) AS last,
        toString(max(received)) AS received
      FROM encounters GROUP BY name ORDER BY name`
    )

    // the fields of the latest payloads of each name, as they were sent: two types of one path
    // are two clients that disagree
    const fields = await this.writer.rows<{
      name: string
      path: string
      types: string[]
    }>(
      `SELECT name, path, arraySort(groupUniqArray(type)) AS types
      FROM (
        SELECT name, typed.1 AS path, typed.2 AS type
        FROM (SELECT name, payload FROM encounters ORDER BY received DESC LIMIT ${SAMPLE} BY name)
        ARRAY JOIN arrayZip(
          mapKeys(JSONAllPathsWithTypes(payload)),
          mapValues(JSONAllPathsWithTypes(payload))
        ) AS typed
      )
      GROUP BY name, path ORDER BY name, path`
    )

    return names.map((encountered) => ({
      ...encountered,
      fields: fields
        .filter(({ name }) => name === encountered.name)
        .map(({ path, types }) => ({ path, types }))
    }))
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
    const tables = await this.listed()

    const refreshes = await this.writer.rows<{ view: string; refreshed: string }>(
      `SELECT view, toString(last_success_time) AS refreshed FROM system.view_refreshes
      WHERE database = currentDatabase() AND last_success_time IS NOT NULL`
    )

    const refreshed = new Map(refreshes.map(({ view, refreshed }) => [view, refreshed]))

    return tables
      .filter((table) => said(table.comment).declared === undefined)
      .map((table) => {
        const { title, description } = said(table.comment)
        const view: View = { name: table.name, sql: table.as_select }

        if (title !== undefined) view.title = title
        if (description !== undefined) view.description = description

        // stated in seconds, and kept in the largest unit that divides them
        const every = /REFRESH EVERY (\d+) (SECOND|MINUTE|HOUR|DAY|WEEK)/.exec(
          table.create_table_query
        )

        if (every !== null) {
          view.refresh = Number(every[1]) * UNITS[every[2]]

          const at = refreshed.get(table.name)

          if (at !== undefined) view.refreshed = at
        }

        return view
      })
  }

  // the comment is on a line of its own: a statement that ends in a comment of its own would
  // take it in otherwise
  public async define(definition: Definition): Promise<void> {
    const { name, sql, refresh, title, description } = definition
    const comment = JSON.stringify({ title, description })

    await this.writer.run(`DROP TABLE IF EXISTS ${ddl.id(name)} SYNC`)

    await refusing(async () => {
      if (refresh === undefined)
        await this.writer.run(
          `CREATE VIEW ${ddl.id(name)} SQL SECURITY INVOKER AS ${sql}\nCOMMENT ${ddl.literal(comment)}`
        )
      else
        await this.writer.run(
          `CREATE MATERIALIZED VIEW ${ddl.id(name)} REFRESH EVERY ${refresh} SECOND
          ENGINE = MergeTree ORDER BY tuple() AS ${sql}\nCOMMENT ${ddl.literal(comment)}`
        )
    })
  }

  public async drop(name: string): Promise<void> {
    await this.writer.run(`DROP TABLE IF EXISTS ${ddl.id(name)} SYNC`)
  }

  private async insert(
    table: string,
    columns: string,
    rows: Array<Row | State | Encounter>
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

  private async engine(table: string): Promise<string> {
    const [found] = await this.writer.rows<{ engine_full: string }>(
      `SELECT engine_full FROM system.tables
      WHERE database = currentDatabase() AND name = ${ddl.literal(table)}`
    )

    return found?.engine_full ?? ''
  }

  /** What the database holds besides the log's own tables: the views. */
  private async listed(): Promise<Table[]> {
    return await this.writer.rows<Table>(
      `SELECT name, as_select, create_table_query, comment FROM system.tables
      WHERE database = currentDatabase()
        AND name NOT IN (${this.tables.map(ddl.literal).join(', ')})
        AND NOT startsWith(name, '.inner')
      ORDER BY name`
    )
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

/** What a view's comment says of it; nothing, of one made otherwise. */
function said(comment: string): Said {
  try {
    const parsed: unknown = JSON.parse(comment)

    return typeof parsed === 'object' && parsed !== null ? (parsed as Said) : {}
  } catch {
    return {}
  }
}

interface Said {
  declared?: string
  title?: string
  description?: string
}

interface Table {
  name: string
  as_select: string
  create_table_query: string
  comment: string
}

const EVENTS = 'id, label, component, time, entity, version, identity, trace, payload'
const STATES = 'component, entity, version, identity, time, payload'
const ENCOUNTERS = 'id, name, time, visitor, session, identity, ip, country, payload'

const UNITS: Record<string, number> = {
  SECOND: 1,
  MINUTE: 60,
  HOUR: 3600,
  DAY: 86400,
  WEEK: 604800
}

const SAMPLE = 1000
const NUMBERS = { output_format_json_quote_64bit_integers: '0' }
