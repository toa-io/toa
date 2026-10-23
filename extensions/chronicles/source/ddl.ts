import { createHash } from 'node:crypto'
import type { Names } from './names.ts'

/**
 * The log in ClickHouse. Every statement is one a second start changes nothing with, so two
 * replicas starting together collide on nothing; what would change — the broker ClickHouse
 * consumes, the retention — is compared with what is there and changed only where it differs.
 */
export const TABLES = [
  'queue',
  'events',
  'states',
  'refused',
  'ingest',
  'current',
  'refuse'
]

export function database(name: string): string[] {
  return [`CREATE DATABASE IF NOT EXISTS ${id(name)}`]
}

/** What is kept: the log, the latest payload of each record, and what was not JSON. */
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
      trace Nullable(String),
      payload JSON
    ) ENGINE = ReplacingMergeTree
    PARTITION BY toYYYYMM(time)
    ORDER BY (label, toDate(time), id)
    ${retention === undefined ? '' : ttl(retention)}`,

    `CREATE TABLE IF NOT EXISTS states (
      label LowCardinality(String),
      component LowCardinality(String),
      entity String,
      version UInt64,
      time DateTime64(3, 'UTC'),
      payload JSON
    ) ENGINE = ReplacingMergeTree(version)
    ORDER BY (label, entity)`,

    `CREATE TABLE IF NOT EXISTS refused (
      received DateTime64(3, 'UTC') DEFAULT now64(3),
      message String
    ) ENGINE = MergeTree
    ORDER BY received`,

    `CREATE MATERIALIZED VIEW IF NOT EXISTS current TO states AS
    SELECT label, component, assumeNotNull(entity) AS entity, assumeNotNull(version) AS version,
      time, payload
    FROM events
    WHERE entity IS NOT NULL AND version IS NOT NULL`
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

/** The consumer of the queue: the broker, the engine table, and what it writes to. */
export function consumer(database: string, relay: string, names: Names): Consumer {
  const collection = `chronicles_${database}`

  const settings: Record<string, string | number> = {
    rabbitmq_address: relay,
    rabbitmq_exchange_name: names.exchange,
    rabbitmq_exchange_type: 'direct',
    rabbitmq_format: 'JSONAsString',
    rabbitmq_queue_consume: 1,
    rabbitmq_queue_base: names.queue,
    rabbitmq_handle_error_mode: 'stream'
  }

  // what the queue table says it was made with, so a start tells a changed broker from the same one
  const fingerprint = createHash('sha256')
    .update(VERSION)
    .update(JSON.stringify(settings))
    .digest('hex')
    .slice(0, 32)

  const assignments = Object.entries(settings)
    .map(
      ([key, value]) => `${key} = ${typeof value === 'number' ? value : literal(value)}`
    )
    .join(', ')

  return {
    fingerprint,

    // the queue is the broker's, so taking the consumer down loses nothing: what it held unacked
    // is delivered again to the one that replaces it
    drop: [
      'DROP TABLE IF EXISTS ingest SYNC',
      'DROP TABLE IF EXISTS refuse SYNC',
      'DROP TABLE IF EXISTS queue SYNC',
      `DROP NAMED COLLECTION IF EXISTS ${id(collection)}`
    ],

    create: [
      `CREATE NAMED COLLECTION IF NOT EXISTS ${id(collection)} AS ${assignments}`,
      `CREATE TABLE IF NOT EXISTS queue (message String)
      ENGINE = RabbitMQ(${id(collection)})
      COMMENT ${literal(fingerprint)}`
    ],

    // `_error` is NULL for what parsed; a message that did not would otherwise fail its batch,
    // which ClickHouse rejects whole
    views: [
      `CREATE MATERIALIZED VIEW IF NOT EXISTS ingest TO events AS
      SELECT
        JSONExtractString(message, 'id') AS id,
        JSONExtractString(message, 'label') AS label,
        JSONExtractString(message, 'component') AS component,
        fromUnixTimestamp64Milli(JSONExtractInt(message, 'time'), 'UTC') AS time,
        JSONExtract(message, 'entity', 'Nullable(String)') AS entity,
        JSONExtract(message, 'version', 'Nullable(UInt64)') AS version,
        JSONExtract(message, 'trace', 'Nullable(String)') AS trace,
        if(JSONType(message, 'payload') = 'Object', JSONExtractRaw(message, 'payload'), '{}')::JSON
          AS payload
      FROM queue
      WHERE _error IS NULL`,

      `CREATE MATERIALIZED VIEW IF NOT EXISTS refuse TO refused AS
      SELECT _raw_message AS message
      FROM queue
      WHERE _error IS NOT NULL`
    ]
  }
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

export interface Consumer {
  fingerprint: string
  drop: string[]
  create: string[]
  views: string[]
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

function ttl(days: number): string {
  return `TTL toDateTime(time) + INTERVAL ${days} DAY`
}

const IDENTIFIER = /^[a-zA-Z_][a-zA-Z0-9_]*$/

/** Changed with what the consumer's statements say, so that a start replaces the old one. */
const VERSION = '1'
