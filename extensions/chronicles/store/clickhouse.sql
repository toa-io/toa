-- The store of every context that publishes to one analytics broker: what Toa publishes, and what
-- it reads. Toa runs none of this; whoever sets the store up does, once, and again where a release
-- of Toa says so. {broker}, {broker_username} and {broker_password} are the broker ClickHouse
-- consumes, as ClickHouse reaches it.

CREATE DATABASE IF NOT EXISTS chronicles;

-- a row for everything a component did, by `id`, kept until `expires`
CREATE TABLE IF NOT EXISTS chronicles.events (
  scope LowCardinality(String),
  id String,
  label LowCardinality(String),
  component LowCardinality(String),
  time DateTime64(3, 'UTC'),
  entity Nullable(String),
  version Nullable(UInt64),
  identity Nullable(String),
  trace Nullable(String),
  payload JSON,
  expires DateTime DEFAULT '2106-01-01 00:00:00'
) ENGINE = ReplacingMergeTree
PARTITION BY toYYYYMM(time)
ORDER BY (scope, label, toDate(time), id)
TTL expires;

-- each entity as it stands, by the latest `version`
CREATE TABLE IF NOT EXISTS chronicles.states (
  scope LowCardinality(String),
  component LowCardinality(String),
  entity String,
  version UInt64,
  identity Nullable(String),
  time DateTime64(3, 'UTC'),
  payload JSON
) ENGINE = ReplacingMergeTree(version)
ORDER BY (scope, component, entity);

-- what clients sent, by `id`, kept and expired by when the gateway received it
CREATE TABLE IF NOT EXISTS chronicles.encounters (
  scope LowCardinality(String),
  id String,
  name LowCardinality(String),
  time DateTime64(3, 'UTC'),
  received DateTime64(3, 'UTC'),
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
  payload JSON,
  expires DateTime DEFAULT '2106-01-01 00:00:00'
) ENGINE = ReplacingMergeTree
PARTITION BY toYYYYMM(received)
ORDER BY (scope, name, toDate(time), id)
TTL expires;

-- what the broker delivers: one JSON row a message, from the exchange `chronicles` under the key
-- of its table, moved into the table by the view beside it
CREATE TABLE IF NOT EXISTS chronicles.events_queue AS chronicles.events
ENGINE = RabbitMQ SETTINGS
  rabbitmq_host_port = '{broker}', rabbitmq_username = '{broker_username}',
  rabbitmq_password = '{broker_password}', rabbitmq_exchange_name = 'chronicles',
  rabbitmq_exchange_type = 'direct', rabbitmq_routing_key_list = 'events',
  rabbitmq_queue_base = 'chronicles.events', rabbitmq_format = 'JSONEachRow',
  rabbitmq_flush_interval_ms = 1000;

-- a message without `expires` reads it as zero rather than as the default, which would expire it
CREATE MATERIALIZED VIEW IF NOT EXISTS chronicles.events_consumer TO chronicles.events
AS SELECT * REPLACE (if(toUnixTimestamp(expires) = 0, toDateTime('2106-01-01 00:00:00'), expires) AS expires)
FROM chronicles.events_queue;

CREATE TABLE IF NOT EXISTS chronicles.states_queue AS chronicles.states
ENGINE = RabbitMQ SETTINGS
  rabbitmq_host_port = '{broker}', rabbitmq_username = '{broker_username}',
  rabbitmq_password = '{broker_password}', rabbitmq_exchange_name = 'chronicles',
  rabbitmq_exchange_type = 'direct', rabbitmq_routing_key_list = 'states',
  rabbitmq_queue_base = 'chronicles.states', rabbitmq_format = 'JSONEachRow',
  rabbitmq_flush_interval_ms = 1000;

CREATE MATERIALIZED VIEW IF NOT EXISTS chronicles.states_consumer TO chronicles.states
AS SELECT * FROM chronicles.states_queue;

CREATE TABLE IF NOT EXISTS chronicles.encounters_queue AS chronicles.encounters
ENGINE = RabbitMQ SETTINGS
  rabbitmq_host_port = '{broker}', rabbitmq_username = '{broker_username}',
  rabbitmq_password = '{broker_password}', rabbitmq_exchange_name = 'chronicles',
  rabbitmq_exchange_type = 'direct', rabbitmq_routing_key_list = 'encounters',
  rabbitmq_queue_base = 'chronicles.encounters', rabbitmq_format = 'JSONEachRow',
  rabbitmq_flush_interval_ms = 1000;

-- a message without `expires` reads it as zero rather than as the default, which would expire it
CREATE MATERIALIZED VIEW IF NOT EXISTS chronicles.encounters_consumer TO chronicles.encounters
AS SELECT * REPLACE (if(toUnixTimestamp(expires) = 0, toDateTime('2106-01-01 00:00:00'), expires) AS expires)
FROM chronicles.encounters_queue;
