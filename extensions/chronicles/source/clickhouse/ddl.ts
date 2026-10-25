/**
 * The log in ClickHouse. Every statement is one a second start changes nothing with, so two
 * replicas starting together collide on nothing; the retention, which would change, is compared
 * with what is there and changed only where it differs.
 */
export const TABLES = ['events', 'states', 'encounters']

export function database(name: string): string[] {
  return [`CREATE DATABASE IF NOT EXISTS ${id(name)}`]
}

/**
 * What is kept: a row for everything a component did, each entity as it stands, and what clients
 * sent. An encounter is kept and expires by when it was received: its `time` is the client's
 * clock, which decides nothing of where a row is.
 */
export function tables(retention: number | undefined): string[] {
  return [
    `CREATE TABLE IF NOT EXISTS events (
      id String,
      label LowCardinality(String),
      component LowCardinality(String),
      time DateTime64(3, 'UTC'),
      received DateTime64(3, 'UTC') DEFAULT now64(3),
      entity Nullable(String),
      version Nullable(UInt64),
      identity Nullable(String),
      trace Nullable(String),
      payload JSON
    ) ENGINE = ReplacingMergeTree
    PARTITION BY toYYYYMM(time)
    ORDER BY (label, toDate(time), id)
    ${retention === undefined ? '' : ttl(retention, 'time')}`,

    `CREATE TABLE IF NOT EXISTS states (
      component LowCardinality(String),
      entity String,
      version UInt64,
      identity Nullable(String),
      time DateTime64(3, 'UTC'),
      received DateTime64(3, 'UTC') DEFAULT now64(3),
      payload JSON
    ) ENGINE = ReplacingMergeTree(version)
    ORDER BY (component, entity)`,

    `CREATE TABLE IF NOT EXISTS encounters (
      id String,
      name LowCardinality(String),
      time DateTime64(3, 'UTC'),
      received DateTime64(3, 'UTC') DEFAULT now64(3),
      visitor Nullable(String),
      session Nullable(String),
      identity Nullable(String),
      ip Nullable(String),
      country LowCardinality(Nullable(String)),
      origin LowCardinality(Nullable(String)),
      agent Nullable(String),
      browser LowCardinality(Nullable(String)),
      os LowCardinality(Nullable(String)),
      device LowCardinality(Nullable(String)),
      payload JSON
    ) ENGINE = ReplacingMergeTree
    PARTITION BY toYYYYMM(received)
    ORDER BY (name, toDate(time), id)
    ${retention === undefined ? '' : ttl(retention, 'received')}`
  ]
}

/** The tables a retention applies to, and the column each expires by. */
export const EXPIRING: Array<[table: string, column: string]> = [
  ['events', 'time'],
  ['encounters', 'received']
]

/**
 * `ALTER TABLE` for the retention declared, given what the table states now; none if it agrees.
 * `column` is the one the table expires by.
 */
// eslint-disable-next-line max-params
export function retention(
  declared: number | undefined,
  engine: string,
  table = 'events',
  column = 'time'
): string[] {
  const pattern = new RegExp(
    `TTL toDateTime\\(${column}\\) \\+ toIntervalDay\\((\\d+)\\)`
  )
  const stated = pattern.exec(engine)?.[1]

  if (declared === undefined)
    return stated === undefined && !engine.includes(' TTL ')
      ? []
      : [`ALTER TABLE ${table} REMOVE TTL`]

  if (stated === String(declared)) return []

  return [`ALTER TABLE ${table} MODIFY ${ttl(declared, column)}`]
}

/**
 * The user queries run as: it reads the database and nothing else, under limits a query cannot
 * lift, because they are constraints of its profile rather than settings a request passes. Past
 * the rows a query is refused, which is the overflow a client's query cache allows; a query of
 * the provider's own asks for one row more than it answers, to tell a full answer from a cut one.
 * Past the bytes, or the queries one reader runs at once, a query is refused.
 */
export function reader(database: string, password: string): string[] {
  const name = id(`${database}_reader`)

  return [
    `CREATE SETTINGS PROFILE IF NOT EXISTS ${name}`,
    `ALTER SETTINGS PROFILE ${name} SETTINGS
      readonly = 2 CONST,
      max_execution_time = ${LIMITS.seconds} CONST,
      max_result_rows = ${LIMITS.rows + 1} CONST,
      max_result_bytes = ${LIMITS.bytes} CONST,
      max_memory_usage = ${LIMITS.memory} CONST,
      max_concurrent_queries_for_user = ${LIMITS.concurrent} CONST`,
    `CREATE USER IF NOT EXISTS ${name} IDENTIFIED WITH sha256_password BY ${literal(password)}`,
    `ALTER USER ${name} IDENTIFIED WITH sha256_password BY ${literal(password)}
      SETTINGS PROFILE ${literal(`${database}_reader`)}`,
    `GRANT SELECT ON ${id(database)}.* TO ${name}`
  ]
}

export const LIMITS = {
  seconds: 30,
  rows: 10_000,
  bytes: 64 * 1024 * 1024,
  memory: 4_000_000_000,
  concurrent: 4
}

/** An identifier, which the annotation and the schema have already held to this. */
export function id(name: string): string {
  if (!IDENTIFIER.test(name))
    throw new Error(`'${name}' is not a ClickHouse identifier chronicles accept`)

  return '`' + name + '`'
}

export function literal(value: string): string {
  return "'" + value.replace(/\\/g, '\\\\').replace(/'/g, "\\'") + "'"
}

function ttl(days: number, column: string): string {
  return `TTL toDateTime(${column}) + INTERVAL ${days} DAY`
}

const IDENTIFIER = /^[a-zA-Z_][a-zA-Z0-9_]*$/
