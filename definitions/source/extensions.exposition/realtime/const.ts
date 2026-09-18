/**
 * Whose stash the streams are: the gateway reads them and a component writes them under this
 * locator, so both resolve one address from the `stash` annotation and one key prefix.
 */
export const STREAMS = 'realtime.streams'

/** A component's routes, as the deployment resolved them from its manifest and the context. */
export const ROUTES = 'TOA_REALTIME_'
