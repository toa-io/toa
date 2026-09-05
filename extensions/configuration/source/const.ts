import type { Source } from '@toa.io/core'

/** Per-component variables: the local override and the secrets. */
export const PREFIX = 'TOA_CONFIGURATION_'

/** The map of every configured component, on the values service. */
export const VALUES = 'TOA_CONFIGURATION_VALUES'

export const SECRET_RX = /^\$(?<variable>[A-Z0-9_]{1,32})$/

/** Where the UI is mounted; `/configuration/*` belongs to the component's own API. */
export const UI_PATH = '/.configuration'
export const UI_PORT = 8003

/**
 * The port the UI is served on. `UI_PORT` is what a deployment publishes and what the chart
 * renders; the variable is for a machine that runs more than one Toa process — a Toa checkout
 * beside an application, or two applications — where one of them has to give it up.
 */
export const UI_PORT_ENV = 'TOA_CONFIGURATION_UI_PORT'
export function uiPort (): number {
  const value = process.env[UI_PORT_ENV]

  return value === undefined ? UI_PORT : Number(value)
}

export const EVENT = 'configuration.values.created'

export const SOURCE: Source = { service: 'configuration' }
