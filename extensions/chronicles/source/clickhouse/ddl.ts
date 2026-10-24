/**
 * The log in ClickHouse. Every statement is one a second start changes nothing with, so two
 * replicas starting together collide on nothing; the retention, which would change, is compared
 * with what is there and changed only where it differs.
 */
export const TABLES = ['events', 'states']

export function database(name: string): string[] {
  return [`CREATE DATABASE IF NOT EXISTS ${id(name)}`]
}

/** What is kept: a row for everything that happened, and each entity as it stands. */
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
    ${retention === undefined ? '' : ttl(retention)}`,

    `CREATE TABLE IF NOT EXISTS states (
      component LowCardinality(String),
      entity String,
      version UInt64,
      identity Nullable(String),
      time DateTime64(3, 'UTC'),
      received DateTime64(3, 'UTC') DEFAULT now64(3),
      payload JSON
    ) ENGINE = ReplacingMergeTree(version)
    ORDER BY (component, entity)`
  ]
}

/** `ALTER TABLE` for the retention declared, given what the table states now; none if it agrees. */
export function retention(declared: number | undefined, engine: string): string[] {
  const stated = /TTL toDateTime\(time\) \+ toIntervalDay\((\d+)\)/.exec(engine)?.[1]

  if (declared === undefined)
    return stated === undefined && !engine.includes(' TTL ')
      ? []
      : ['ALTER TABLE events REMOVE TTL']

  if (stated === String(declared)) return []

  return [`ALTER TABLE events MODIFY ${ttl(declared)}`]
}

/**
 * The user queries run as: it reads the database and nothing else, under limits a query cannot
 * lift, because they are constraints of its profile rather than settings a request passes.
 */
export function reader(database: string, password: string): string[] {
  const name = id(`${database}_reader`)

  return [
    `CREATE SETTINGS PROFILE IF NOT EXISTS ${name}`,
    `ALTER SETTINGS PROFILE ${name} SETTINGS
      readonly = 2 CONST,
      max_execution_time = ${LIMITS.seconds} CONST,
      max_result_rows = ${LIMITS.rows} CONST,
      result_overflow_mode = 'break' CONST,
      max_memory_usage = ${LIMITS.memory} CONST`,
    `CREATE USER IF NOT EXISTS ${name} IDENTIFIED WITH sha256_password BY ${literal(password)}`,
    `ALTER USER ${name} IDENTIFIED WITH sha256_password BY ${literal(password)}
      SETTINGS PROFILE ${literal(`${database}_reader`)}`,
    `GRANT SELECT ON ${id(database)}.* TO ${name}`
  ]
}

export const LIMITS = { seconds: 30, rows: 10_000, memory: 4_000_000_000 }

/** An identifier, which the annotation and the schema have already held to this. */
export function id(name: string): string {
  if (!IDENTIFIER.test(name))
    throw new Error(`'${name}' is not a ClickHouse identifier chronicles accept`)

  return '`' + name + '`'
}

export function literal(value: string): string {
  return "'" + value.replace(/\\/g, '\\\\').replace(/'/g, "\\'") + "'"
}

function ttl(days: number): string {
  return `TTL toDateTime(time) + INTERVAL ${days} DAY`
}

const IDENTIFIER = /^[a-zA-Z_][a-zA-Z0-9_]*$/
