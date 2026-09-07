export const BRANCH_TTL = 1_800_000

/** The broadcast the gateway and its tenants share. */
export const CHANNEL = 'exposition'

/** The replicas of the gateway decide together, whatever context they serve. */
export const ATOM_GROUP = 'exposition'

/**
 * Where JSON-RPC is served, for every procedure at once. Pinned rather than configured: a
 * path an application could choose is a path it could collide with a route of its own.
 */
export const RPC = '/.rpc'

/** Calls one request may carry where the annotation does not say. */
export const BATCH = 32

/**
 * Where the Model Context Protocol is served. Pinned for the reason `/.rpc` is: a path an
 * application could choose is a path it could collide with a route of its own.
 */
export const MCP = '/.mcp'

/**
 * Where the resource tree and the page that reads it are served. Pinned for the reason
 * `/.rpc` is: a path an application could choose is a path it could collide with a route of
 * its own. Unlike those two it is not annotated — every entry it carries is what `OPTIONS`
 * on that path already answers to the same caller, and what it adds is the enumeration.
 */
export const DISCOVERY = '/.discovery'

/** Where the gateway serves. */
export const PORT = 8000

/**
 * Reserved for the readiness probe. `8001` is the Telemetry readiness probe's, and `toa export`
 * refuses a port claimed twice — `toa mono` and a local run put every service in one process.
 */
export const PROBE = 8004

/**
 * The initial delay of the readiness probe. The server does not sleep for it: whoever
 * probes is the one that waits, and doing it here as well only delayed the process twice.
 */
export const DELAY = 3 // seconds
