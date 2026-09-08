/** What the pointer to a region's brokers is deployed and resolved under. */
export const ID = 'convergence'

/** The one selector of that pointer: a region has one set of brokers. */
export const BROKERS = 'brokers'

/** Which region a deployment is, by name, read where it is deployed rather than at runtime. */
export const SELECTOR = 'TOA_CONVERGENCE_REGION'

/** The rank of that region, which is what the runtime stamps on a record it writes. */
export const REGION = 'TOA_REGION'

/** The binding that carries the channel. */
export const BINDING = 'TOA_CONVERGENCE_BINDING'

/** What the channel is called, and so what its exchanges and queues are named after. */
export const CHANNEL = 'convergence'
