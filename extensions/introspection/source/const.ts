export const ID = 'introspection'
export const NAMESPACE = 'introspection'

export const ENV = 'TOA_INTROSPECTION'

export const NODES = 'nodes'
export const EDGES = 'edges'

/** Where the UI is mounted; `/introspection/*` belongs to the components' own API. */
export const UI_PATH = '/.introspection'
export const UI_PORT = 8002

/**
 * The port the UI is served on. `UI_PORT` is what a deployment publishes and what the chart
 * renders; the variable is for a machine that runs more than one Toa process — a Toa checkout
 * beside an application, or two applications — where one of them has to give it up.
 */
export const UI_PORT_ENV = 'TOA_INTROSPECTION_UI_PORT'
export function uiPort (): number {
  const value = process.env[UI_PORT_ENV]

  return value === undefined ? UI_PORT : Number(value)
}

export const DEFAULT_INTERVAL = 300
export const DEFAULT_THRESHOLD = 1024

/** How often a component re-announces its description, so that removed components fade out. */
export const ANNOUNCE_INTERVAL = 1_800_000

/**
 * `source` arrives over the wire, so the number of distinct edges a process
 * can hold must be bounded regardless of what peers send.
 */
export const MAX_EDGES = 4096

/** Never capture samples for these namespaces, whatever the annotation says. */
export const DENIED = new Set(['identity', 'introspection'])

/** Keys never stored in a sample, even when sampling is on. */
export const REDACTED = /^(password|secret|token|credentials?|key|authorization|cookie)$/i

/** Serialized size cap of a single sample. */
export const SAMPLE_LIMIT = 4096
