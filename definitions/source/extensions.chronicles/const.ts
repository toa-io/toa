/** What the service is given of the annotation, as JSON, and what its secrets are named after. */
export const SETTINGS = 'TOA_CHRONICLES'

/** The secret of the store: the user it is provisioned as, and the password of its reader. */
export const SECRET = 'toa-chronicles-store'

/** The namespace of the components this extension ships. */
export const NAMESPACE = 'chronicles'

/** The service they run in, which is also the one consumer of the events the log is kept of. */
export const SERVICE = 'scribe'

/** The component `send` writes through. */
export const FACTS = 'facts'

/** The component browsers write through, and the prefix of what they write. */
export const INGESTION = 'ingestion'
export const CLIENT = 'client'

/** The component the log is read through. */
export const QUERIES = 'queries'

/** The stores Toa provides. */
export const PROVIDERS = ['clickhouse'] as const
