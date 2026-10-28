import { environment } from '@toa.io/generic'
import {
  BROKER_KEYS,
  KEYS,
  SETTINGS,
  STORE_KEYS
} from '@toa.io/definitions/extensions.chronicles'
import type { Settings } from '@toa.io/definitions/extensions.chronicles'

/** Where the log is published and read, and what it is kept of, as the service is deployed with them. */
export function settings(): Settings {
  const value = environment.get(SETTINGS)

  if (value !== undefined) return JSON.parse(value) as Settings

  if (dev()) return DEV

  throw new Error(`${SETTINGS} is not set, so nothing says where the log is kept.`)
}

/**
 * The users of the broker the rows are published to, and of the store they are read from where
 * the log is read here.
 */
export function credentials(): Credentials {
  const [brokerUsername, brokerPassword] = BROKER_KEYS.map(variable)
  const [storeUsername, storePassword] = STORE_KEYS.map(variable)
  const reads = settings().store !== undefined

  if (brokerUsername !== undefined && brokerPassword !== undefined) {
    const broker = { username: brokerUsername, password: brokerPassword }

    if (storeUsername !== undefined && storePassword !== undefined)
      return { broker, store: { username: storeUsername, password: storePassword } }

    if (!reads) return { broker }
  }

  // the development stack's broker, and the context's user of its store, as the reference setup
  // makes one
  if (dev())
    return {
      broker: { username: 'developer', password: 'secret' },
      store: { username: environment.scope(), password: 'secret' }
    }

  const keys = reads ? KEYS : BROKER_KEYS

  throw new Error(`${SETTINGS}_{${keys.join(',').toUpperCase()}} are not all set.`)
}

function variable(key: string): string | undefined {
  return environment.get(`${SETTINGS}_${key.toUpperCase()}`)
}

export interface Credentials {
  broker: User

  /** absent where the context writes the log and does not read it */
  store?: User
}

export interface User {
  username: string
  password: string
}

function dev(): boolean {
  return environment.get('TOA_DEV') === '1'
}

// Toa's own development stack is not on the conventional ports, which the applications built on
// Toa are on. See CONTRIBUTING.md.
const DEV: Settings = {
  broker: 'amqp://localhost:31010',
  store: { provider: 'clickhouse', url: 'http://localhost:31030' },
  encounters: true,
  ip: 'truncated',
  events: {},
  states: {},
  facts: {},
  identities: {},
  timestamps: {}
}
