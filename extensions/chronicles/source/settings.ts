import { environment } from '@toa.io/generic'
import { resolve } from '@toa.io/pointer'
import { BROKER, ID, SETTINGS } from '@toa.io/definitions/extensions.chronicles'
import type { Settings } from '@toa.io/definitions/extensions.chronicles'

/** Where the log is kept, as the service is deployed with it. */
export function settings(): Settings {
  const value = environment.get(SETTINGS)

  if (value !== undefined) return JSON.parse(value) as Settings

  if (dev()) return DEV

  throw new Error(`${SETTINGS} is not set, so nothing says where the log is kept.`)
}

/** The writer ClickHouse is provisioned as, and the password of the reader it creates. */
export function credentials(): Credentials {
  const [username, password, reader] = KEYS.map((key) =>
    environment.get(`${SETTINGS}_CLICKHOUSE_${key}`)
  )

  if (username !== undefined && password !== undefined && reader !== undefined)
    return { username, password, reader }

  if (dev()) return { username: 'developer', password: 'secret', reader: 'secret' }

  throw new Error(`${SETTINGS}_CLICKHOUSE_{USERNAME,PASSWORD,READER} are not all set.`)
}

/** The broker every component publishes to, with its credentials. */
export function broker(): string {
  if (
    environment.get(`TOA_${ID.toUpperCase()}_${BROKER.toUpperCase()}`) === undefined &&
    dev()
  )
    return DEV_BROKER

  return resolve(ID, BROKER)[0]
}

/**
 * The broker as ClickHouse reaches it, with the credentials the components publish with unless
 * its address carries some of its own.
 */
export function relay(settings: Settings): string {
  const url = new URL(settings.clickhouse.broker)

  if (url.username !== '') return url.href

  const { username, password } = new URL(broker())

  url.username = username
  url.password = password

  return url.href
}

export interface Credentials {
  username: string
  password: string

  /** the password of the reader */
  reader: string
}

function dev(): boolean {
  return environment.get('TOA_DEV') === '1'
}

const KEYS = ['USERNAME', 'PASSWORD', 'READER']

/*
 * Toa's own development stack is not on the conventional ports, which the applications built on
 * Toa are on, and ClickHouse reaches RabbitMQ over the compose network. See CONTRIBUTING.md.
 */
const DEV_BROKER = 'amqp://developer:secret@localhost:31010'

const DEV: Settings = {
  clickhouse: {
    url: 'http://localhost:31030/chronicles',
    broker: 'amqp://developer:secret@rabbitmq:5672'
  },
  ingest: true
}
