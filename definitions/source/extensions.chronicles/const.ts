/** What the pointer to the broker is deployed and resolved under. */
export const ID = 'chronicles'

/** The one selector of that pointer: the log is one queue on one broker. */
export const BROKER = 'broker'

/** What the service is given of the annotation, as JSON. */
export const SETTINGS = 'TOA_CHRONICLES'

/** The namespace of the components this extension ships. */
export const NAMESPACE = 'chronicles'

/** The service they run in. */
export const SERVICE = 'scribe'

/** The binding that carries the channel, which RabbitMQ is the only one to. */
export const BINDING = '@toa.io/bindings.amqp'

/** What the channel is called, and so what its exchange is named after: `chronicles.out`. */
export const CHANNEL = 'chronicles'

/** The routing key of every message: the label is in the body. */
export const ROUTE = 'events'

/** The queue ClickHouse consumes. */
export const QUEUE = 'chronicles'

/** Where the queue dead-letters what ClickHouse rejects, and the queue that keeps it. */
export const DEAD = 'chronicles.dead'

/** The component browsers send to, and the prefix of what it writes. */
export const INGEST = 'ingest'
export const CLIENT = 'client'

/** The component the log is read through. */
export const QUERY = 'query'
