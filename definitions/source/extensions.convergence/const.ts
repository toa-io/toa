/** What the pointer to this region's brokers is deployed and resolved under. */
export const ID = 'convergence'

/** The one selector of that pointer: a region has one set of brokers. */
export const BROKERS = 'brokers'

/** The rank of this region, which is what the runtime stamps on a record it writes. */
export const REGION = 'TOA_REGION'

/** The binding that carries the channel. */
export const BINDING = 'TOA_CONVERGENCE_BINDING'

/** What the channel is called, and so what its exchanges and queues are named after. */
export const CHANNEL = 'convergence'
