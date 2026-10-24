import { environment } from '@toa.io/generic'
import { SETTINGS } from '@toa.io/definitions/extensions.chronicles'
import type { Settings } from '@toa.io/definitions/extensions.chronicles'

/** Where the log is kept and what it is kept of, as the service is deployed with them. */
export function settings(): Settings {
  const value = environment.get(SETTINGS)

  if (value !== undefined) return JSON.parse(value) as Settings

  if (dev()) return DEV

  throw new Error(`${SETTINGS} is not set, so nothing says where the log is kept.`)
}

/** The user the store is provisioned as, and the password of the reader it creates. */
export function credentials(): Credentials {
  const [username, password, reader] = KEYS.map((key) =>
    environment.get(`${SETTINGS}_STORE_${key}`)
  )

  if (username !== undefined && password !== undefined && reader !== undefined)
    return { username, password, reader }

  if (dev()) return { username: 'developer', password: 'secret', reader: 'secret' }

  throw new Error(`${SETTINGS}_STORE_{USERNAME,PASSWORD,READER} are not all set.`)
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

// Toa's own development stack is not on the conventional ports, which the applications built on
// Toa are on. See CONTRIBUTING.md.
const DEV: Settings = {
  store: { provider: 'clickhouse', url: 'http://localhost:31030/chronicles' },
  encounters: true,
  ip: 'truncated',
  events: {},
  states: {},
  facts: {},
  identities: {}
}
