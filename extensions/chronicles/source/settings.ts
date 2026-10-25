import { environment } from '@toa.io/generic'
import { KEYS, SETTINGS } from '@toa.io/definitions/extensions.chronicles'
import type { Settings } from '@toa.io/definitions/extensions.chronicles'

/** Where the log is published and read, and what it is kept of, as the service is deployed with them. */
export function settings(): Settings {
  const value = environment.get(SETTINGS)

  if (value !== undefined) return JSON.parse(value) as Settings

  if (dev()) return DEV

  throw new Error(`${SETTINGS} is not set, so nothing says where the log is kept.`)
}

/** The users of the broker the rows are published to, and of the store they are read from. */
export function credentials(): Credentials {
  const [brokerUsername, brokerPassword, storeUsername, storePassword] = KEYS.map((key) =>
    environment.get(`${SETTINGS}_${key.toUpperCase()}`)
  )

  if (
    brokerUsername !== undefined &&
    brokerPassword !== undefined &&
    storeUsername !== undefined &&
    storePassword !== undefined
  )
    return {
      broker: { username: brokerUsername, password: brokerPassword },
      store: { username: storeUsername, password: storePassword }
    }

  // the development stack's broker, and the context's user of its store, as the reference setup
  // makes one
  if (dev())
    return {
      broker: { username: 'developer', password: 'secret' },
      store: { username: environment.scope(), password: 'secret' }
    }

  throw new Error(`${SETTINGS}_{${KEYS.join(',').toUpperCase()}} are not all set.`)
}

export interface Credentials {
  broker: User
  store: User
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
