export const BRANCH_TTL = 1_800_000

/** The replicas of the gateway decide together, whatever context they serve. */
export const ATOM_GROUP = 'exposition'

/**
 * Where JSON-RPC is served, for every procedure at once. Pinned rather than configured: a
 * path an application could choose is a path it could collide with a route of its own.
 */
export const RPC = '/.rpc'
