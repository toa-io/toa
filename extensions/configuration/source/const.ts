import type { Source } from '@toa.io/core/types'

/** Per-component variables: the local override and the secrets. */
export const PREFIX = 'TOA_CONFIGURATION_'

/** The map of every configured component, on the values service. */
export const VALUES = 'TOA_CONFIGURATION_VALUES'

export const SECRET_RX = /^\$(?<variable>[A-Z0-9_]{1,32})$/

/** Where the UI is mounted; `/configuration/*` belongs to the component's own API. */
export const UI_PATH = '/.configuration'
export const UI_PORT = 8003

export const EVENT = 'configuration.values.created'

export const SOURCE: Source = { service: 'configuration' }
