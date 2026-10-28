/** What the service is given of the annotation, as JSON, and what its secrets are named after. */
export const SETTINGS = 'TOA_CHRONICLES'

/** The secret of the broker the rows are published to, and of the store they are read from. */
export const SECRET = 'toa-chronicles'

/** Its keys: the user of the broker, which every context that keeps the log has. */
export const BROKER_KEYS = ['broker_username', 'broker_password']

/** And the user of the store, which only a context that reads the log has. */
export const STORE_KEYS = ['store_username', 'store_password']

/** All of them. */
export const KEYS = [...BROKER_KEYS, ...STORE_KEYS]

/** The namespace of the components this extension ships. */
export const NAMESPACE = 'chronicles'

/** The service they run in, which is also the one consumer of the events the log is kept of. */
export const SERVICE = 'relay'

/** The component that publishes the rows: of events, of facts `send` tasks it with, of encounters. */
export const RELAY = 'relay'

/** The exchange of the broker the rows are published to, under the key of their table. */
export const EXCHANGE = 'chronicles'

/** The component clients send encounters through, which documents them. */
export const ENCOUNTERS = 'encounters'

/** The component the log is read through. */
export const QUERIES = 'queries'

/** The stores Toa provides. */
export const PROVIDERS = ['clickhouse'] as const
