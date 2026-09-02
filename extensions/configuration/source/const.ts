import type { Source } from '@toa.io/core'

/** Per-component variables: the local override and the secrets. */
export const PREFIX = 'TOA_CONFIGURATION_'

/** The map of every configured component, on the values service. */
export const VALUES = 'TOA_CONFIGURATION_VALUES'

export const SECRET_RX = /^\$(?<variable>[A-Z0-9_]{1,32})$/

export const EVENT = 'configuration.values.created'

export const SOURCE: Source = { service: 'configuration' }
