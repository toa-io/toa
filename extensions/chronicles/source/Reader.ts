import { Connector, exceptions } from '@toa.io/core'
import { ClickHouseError, type ClickHouse } from './ClickHouse.ts'
import { LIMITS, TABLES, id, literal } from './ddl.ts'

/**
 * What `chronicles.query` reads the log through: queries as the reader, which can read the
 * database and nothing else, and views made by the writer from a SELECT the reader was let run.
 */
export class Reader extends Connector {
  public readonly name = 'chronicles'

  private readonly writer: ClickHouse
  private readonly reader: ClickHouse

  public constructor(writer: ClickHouse, reader: ClickHouse) {
    super()

    this.writer = writer
    this.reader = reader
  }

  public async invoke(method: string, ...args: any[]): Promise<unknown> {
    switch (method) {
      case 'describe':
        return await this.describe()
      case 'query':
        return await this.query(args[0])
      case 'define':
        return await this.define(args[0], args[1], args[2])
      case 'drop':
        return await this.drop(args[0])
      default:
        throw new exceptions.MisuseException(`Chronicles have no '${method}'`)
    }
  }

  /** The labels, with their counts, their times and their payloads' paths; and the views. */
  private async describe(): Promise<Description> {
    const labels = await this.writer.rows<Label>(
      `SELECT label, count() AS rows, toString(min(time)) AS first, toString(max(time)) AS last
      FROM events GROUP BY label ORDER BY label`
    )

    // the paths of the latest payloads of each label, which is what a query is written against
    const paths = await this.writer.rows<{ label: string; paths: string[] }>(
      `SELECT label, arraySort(groupUniqArrayArray(JSONAllPaths(payload))) AS paths
      FROM (SELECT label, payload FROM events ORDER BY time DESC LIMIT ${SAMPLE} BY label)
      GROUP BY label`
    )

    const byLabel = new Map(paths.map(({ label, paths }) => [label, paths]))

    for (const label of labels) label.paths = byLabel.get(label.label) ?? []

    return { labels, views: await this.views() }
  }

  private async query(sql: string): Promise<Result | Error> {
    try {
      const answer = await this.reader.select(statement(sql), NUMBERS)

      return {
        columns: answer.meta,
        rows: answer.data.slice(0, LIMITS.rows),
        truncated: answer.data.length >= LIMITS.rows
      }
    } catch (exception) {
      return refused(exception)
    }
  }

  private async define(
    name: string,
    sql: string,
    refresh?: number
  ): Promise<Error | undefined> {
    if (TABLES.includes(name))
      return new Error('RESERVED', {
        cause: { message: `'${name}' is a table of the log` }
      })

    const select = statement(sql)

    // parsed and planned as the reader, which is what refuses a view that reads what a query
    // could not
    try {
      const [ast] = await this.reader.rows<{ explain: string }>(`EXPLAIN AST ${select}`)

      if (!ast.explain.startsWith('SelectWithUnionQuery'))
        return new Error('REFUSED', { cause: { message: 'A view is one SELECT' } })

      await this.reader.run(`EXPLAIN PLAN ${select}`)
    } catch (exception) {
      return refused(exception)
    }

    const views = await this.views()

    if (!views.some((view) => view.name === name) && views.length >= MAX_VIEWS)
      return new Error('EXHAUSTED', {
        cause: { message: `A context has at most ${MAX_VIEWS} views` }
      })

    await this.writer.run(`DROP TABLE IF EXISTS ${id(name)} SYNC`)

    try {
      if (refresh === undefined)
        await this.writer.run(`CREATE VIEW ${id(name)} SQL SECURITY INVOKER AS ${select}`)
      else
        await this.writer.run(
          `CREATE MATERIALIZED VIEW ${id(name)} REFRESH EVERY ${refresh} SECOND
          ENGINE = MergeTree ORDER BY tuple() AS ${select}`
        )
    } catch (exception) {
      return refused(exception)
    }

    return undefined
  }

  private async drop(name: string): Promise<Error | undefined> {
    const views = await this.views()

    if (!views.some((view) => view.name === name)) return new Error('NOT_FOUND')

    await this.writer.run(`DROP TABLE ${id(name)} SYNC`)

    return undefined
  }

  private async views(): Promise<View[]> {
    const tables = await this.writer.rows<Table>(
      `SELECT name, engine, as_select, create_table_query FROM system.tables
      WHERE database = currentDatabase()
        AND name NOT IN (${TABLES.map(literal).join(', ')})
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
}

/** One statement: a trailing semicolon is the agent's habit, and the format is the reader's. */
function statement(sql: string): string {
  return sql.trim().replace(/;+$/, '').trim()
}

function refused(exception: unknown): Error {
  if (exception instanceof ClickHouseError)
    return new Error('REFUSED', { cause: { message: exception.message } })

  throw exception
}

interface Description {
  labels: Label[]
  views: View[]
}

interface Label {
  label: string
  rows: number
  first: string
  last: string
  paths?: string[]
}

interface View {
  name: string
  sql: string

  /** seconds between computations of a materialized view */
  refresh?: number
}

interface Result {
  columns: Array<{ name: string; type: string }>
  rows: unknown[][]
  truncated: boolean
}

interface Table {
  name: string
  engine: string
  as_select: string
  create_table_query: string
}

const UNITS: Record<string, number> = {
  SECOND: 1,
  MINUTE: 60,
  HOUR: 3600,
  DAY: 86400,
  WEEK: 604800
}

const SAMPLE = 1000
const MAX_VIEWS = 50
const NUMBERS = { output_format_json_quote_64bit_integers: '0' }
