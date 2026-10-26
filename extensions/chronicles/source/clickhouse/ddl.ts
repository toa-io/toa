/** The log's tables, which a view is not named after. */
export const TABLES = ['events', 'states', 'encounters']

/** What a query answers at most, which the provider cuts a result at to tell it is cut. */
export const LIMITS = { rows: 10_000 }

/** An identifier, quoted: a scope, which may have hyphens, or a name held to letters and digits. */
export function id(name: string): string {
  if (!IDENTIFIER.test(name))
    throw new Error(`'${name}' is not a ClickHouse identifier chronicles accept`)

  return '`' + name + '`'
}

export function literal(value: string): string {
  return "'" + value.replace(/\\/g, '\\\\').replace(/'/g, "\\'") + "'"
}

const IDENTIFIER = /^[a-zA-Z0-9_][a-zA-Z0-9_-]*$/
