import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { ClickHouse, ClickHouseError } from './Client.ts'
import * as ddl from './ddl.ts'
import * as views from './views.ts'
import { Refusal } from '../Provider.ts'
import type {
  Definition,
  Encountered,
  Field,
  Label,
  Provider,
  Result,
  Summary,
  View
} from '../Provider.ts'
import type { User } from '../settings.ts'
import type { Property } from '@toa.io/definitions/extensions.chronicles'

/**
 * The log in ClickHouse, read as the context's user of it: `events`, `states` and `encounters` in
 * the user's default database, which the store lets it read the rows of its scope of, under limits
 * of its own. A query is asked to be read-only besides; only a view is created, in the database
 * named after the scope, where the store lets the user create one.
 *
 * A view says what it is in its comment, as JSON: the `title` and the `description` it was defined
 * with.
 */
export class ClickHouseProvider implements Provider {
  public readonly guide = GUIDE
  public readonly tables = ddl.TABLES

  private readonly user: ClickHouse
  private readonly scope: string

  /** `scope` is the context's, which its views are kept under */
  public constructor(url: string, user: User, scope: string) {
    this.user = new ClickHouse(url, user.username, user.password)
    this.scope = scope
  }

  public fields(properties: Record<string, Property>): Field[] {
    return views.fields(properties)
  }

  public async states(): Promise<Summary[]> {
    return await this.read<Summary>(
      `SELECT component, uniqExact(entity) AS entities, toString(max(time)) AS last
      FROM states GROUP BY component ORDER BY component`
    )
  }

  public async labels(): Promise<Label[]> {
    return await this.read<Label>(
      `SELECT label, count() AS rows, toString(min(time)) AS first, toString(max(time)) AS last
      FROM events GROUP BY label ORDER BY label`
    )
  }

  public async encounters(): Promise<Encountered[]> {
    const names = await this.read<Omit<Encountered, 'fields'>>(
      `SELECT name, count() AS rows, toString(min(time)) AS first, toString(max(time)) AS last,
        toString(max(received)) AS received
      FROM encounters GROUP BY name ORDER BY name`
    )

    // the fields of the latest payloads of each name, as they were sent: two types of one path
    // are two clients that disagree
    const fields = await this.read<{ name: string; path: string; types: string[] }>(
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
    const settings = { ...READONLY, ...NUMBERS, limit: String(ddl.LIMITS.rows + 1) }
    const answer = await refusing(async () => await this.user.select(sql, settings))

    return {
      columns: answer.meta,
      rows: answer.data.slice(0, ddl.LIMITS.rows),
      truncated: answer.data.length > ddl.LIMITS.rows
    }
  }

  // parsed and planned as the user, which is what refuses a view that reads what a query could not
  public async validate(sql: string): Promise<void> {
    await refusing(async () => {
      const [ast] = await this.read<{ explain: string }>(`EXPLAIN AST ${sql}`)

      if (!ast.explain.startsWith('SelectWithUnionQuery'))
        throw new Refusal('A view is one SELECT')

      await this.user.run(`EXPLAIN PLAN ${sql}`, READONLY)
    })
  }

  public async views(): Promise<View[]> {
    const tables = await this.read<Table>(
      `SELECT name, as_select, create_table_query, comment FROM system.tables
      WHERE database = ${ddl.literal(this.scope)} AND NOT startsWith(name, '.')
      ORDER BY name`
    )

    const refreshes = await this.read<{ view: string; refreshed: string }>(
      `SELECT view, toString(last_success_time) AS refreshed FROM system.view_refreshes
      WHERE database = ${ddl.literal(this.scope)} AND last_success_time IS NOT NULL`
    )

    const refreshed = new Map(refreshes.map(({ view, refreshed }) => [view, refreshed]))

    return tables.map((table) => {
      const { title, description } = said(table.comment)
      const view: View = {
        name: table.name,
        read: `${ddl.id(this.scope)}.${ddl.id(table.name)}`,
        sql: table.as_select
      }

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
    const comment = ddl.literal(JSON.stringify({ title, description }))
    const view = this.view(name)

    await refusing(async () => {
      await this.user.run(`DROP TABLE IF EXISTS ${view} SYNC`)

      if (refresh === undefined)
        await this.user.run(
          `CREATE VIEW ${view} SQL SECURITY INVOKER AS ${sql}\nCOMMENT ${comment}`
        )
      else
        await this.user.run(
          `CREATE MATERIALIZED VIEW ${view} REFRESH EVERY ${refresh} SECOND
          ENGINE = MergeTree ORDER BY tuple() AS ${sql}\nCOMMENT ${comment}`
        )
    })
  }

  public async drop(name: string): Promise<void> {
    await refusing(
      async () => await this.user.run(`DROP TABLE IF EXISTS ${this.view(name)} SYNC`)
    )
  }

  private view(name: string): string {
    return `${ddl.id(this.scope)}.${ddl.id(name)}`
  }

  private async read<T>(sql: string): Promise<T[]> {
    return await this.user.rows<T>(sql, READONLY)
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
  title?: string
  description?: string
}

interface Table {
  name: string
  as_select: string
  create_table_query: string
  comment: string
}

const UNITS: Record<string, number> = {
  SECOND: 1,
  MINUTE: 60,
  HOUR: 3600,
  DAY: 86400,
  WEEK: 604800
}

const SAMPLE = 1000
const GUIDE = readFileSync(
  resolve(import.meta.dirname, '../../guides/clickhouse.md'),
  'utf8'
)
const NUMBERS = { output_format_json_quote_64bit_integers: '0' }

/** what a request asks besides its user's rights: to change nothing */
const READONLY = { readonly: '1' }
