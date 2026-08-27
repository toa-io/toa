export const ID = 'introspection'
export const NAMESPACE = 'introspection'

export const ENV = 'TOA_INTROSPECTION'

export const NODES = 'nodes'
export const EDGES = 'edges'

/** `introspection.nodes` upserts a component description. */
export const TRANSIT = 'transit'

/** `introspection.edges` folds a batch of increments in, over `query.ids`. */
export const MERGE = 'merge'

export const DEFAULT_INTERVAL = 15
export const DEFAULT_THRESHOLD = 256

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
