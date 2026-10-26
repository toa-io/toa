/**
 * ClickHouse over its HTTP interface, as one user: `fetch` and nothing else, because what the log
 * needs of it is a statement and its answer.
 */
export class ClickHouse {
  private readonly endpoint: string
  private readonly headers: Record<string, string>

  /** The statements run in the user's default database, which is what the store gives it to read. */
  public constructor(address: string, user: string, key: string) {
    const url = new URL(address)

    this.endpoint = `${url.protocol}//${url.host}/`
    this.headers = { 'x-clickhouse-user': user, 'x-clickhouse-key': key }
  }

  /** A statement that answers nothing worth reading. */
  public async run(sql: string, settings: Record<string, string> = {}): Promise<void> {
    await this.request(sql, settings)
  }

  /**
   * A query, answered as `JSONCompact`: the columns, and the rows as arrays. The format is the
   * default rather than a clause, which a statement like `EXPLAIN` would take as its own.
   */
  public async select(
    sql: string,
    settings: Record<string, string> = {}
  ): Promise<Answer> {
    const text = await this.request(sql, { ...settings, default_format: 'JSONCompact' })

    return parse(text) as Answer
  }

  /** Each row as an object, for what this extension reads of the store itself. */
  public async rows<T = Record<string, unknown>>(
    sql: string,
    settings: Record<string, string> = {}
  ): Promise<T[]> {
    const text = await this.request(sql, {
      ...settings,
      ...NUMBERS,
      default_format: 'JSON'
    })

    return (parse(text) as { data: T[] }).data
  }

  private async request(sql: string, settings: Record<string, string>): Promise<string> {
    const search = new URLSearchParams(settings)

    const response = await fetch(`${this.endpoint}?${search.toString()}`, {
      method: 'POST',
      headers: this.headers,
      body: sql
    })

    const text = await response.text()

    if (!response.ok) throw new ClickHouseError(response.status, text.trim())

    return text
  }
}

export interface Answer {
  meta: Array<{ name: string; type: string }>
  data: unknown[][]
  rows: number
}

/** What ClickHouse refused a statement with, as it said it. */
export class ClickHouseError extends Error {
  public readonly status: number

  /** ClickHouse's own code, where its message carries one */
  public readonly code: number | undefined

  public constructor(status: number, message: string) {
    super(message)

    this.status = status

    const code = /^Code: (\d+)\./.exec(message)?.[1]

    this.code = code === undefined ? undefined : Number(code)
  }
}

/** An answer in another format is one the statement asked for itself, with a `FORMAT`. */
function parse(text: string): unknown {
  try {
    return JSON.parse(text)
  } catch {
    throw new ClickHouseError(
      200,
      'The answer is not JSON: a statement leaves `FORMAT` out'
    )
  }
}

/** UInt64 as numbers rather than strings: what this extension reads of them is counts. */
const NUMBERS = { output_format_json_quote_64bit_integers: '0' }
