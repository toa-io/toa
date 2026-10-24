import { components } from './components.ts'
import { version } from '../version.ts'
import { INGESTION, NAMESPACE, SECRET, SERVICE, SETTINGS } from './const.ts'
import * as schemas from './schemas.ts'
import type { Annotation, Declaration, Settings } from './types.ts'
import type { context } from '@toa.io/norm'
import type { Dependency, Service, Variable } from '@toa.io/operations'

/**
 * The events the components name are consumed, so they are published, and the service consumes
 * them: it is given which they are, the store, and the store's credentials, which nothing else is.
 * Where the events travel is the context's `amqp`, as it is for any receiver.
 */
export function deployment(
  instances: context.Dependency[],
  annotation: Annotation | undefined
): Dependency {
  // the components the extension ships are among the instances, and declare nothing to keep
  const declaring = instances.filter(
    (instance) => instance.locator.namespace !== NAMESPACE
  )

  if (annotation === undefined)
    throw new Error(
      `Chronicles are declared by '${declaring.map((instance) => instance.locator.id).join("', '")}', ` +
        "and the context has no 'chronicles' annotation."
    )

  schemas.annotation.validate<Annotation>(annotation, 'Invalid chronicles annotation')

  const events: string[] = []
  const states: string[] = []
  const identities: Record<string, string> = {}

  for (const instance of declaring) {
    const declaration = (instance.manifest as unknown as Declaration | undefined) ?? NONE
    const id = instance.locator.id

    for (const label of declaration.events) events.push(`${id}.${label}`)

    if (declaration.state !== undefined) states.push(`${id}.${declaration.state}`)
    if (declaration.identity !== null) identities[id] = declaration.identity
  }

  const settings: Settings = {
    ...read(annotation),
    events,
    states,
    identities
  }

  const labels = components().labels.filter(
    (label) => settings.ingest || label !== `${NAMESPACE}-${INGESTION}`
  )

  const service: Service = {
    group: NAMESPACE,
    name: SERVICE,
    version,
    components: labels,
    variables: [{ name: SETTINGS, value: JSON.stringify(settings) }, ...credentials()]
  }

  // a state's event is consumed as an event's is
  return { services: [service], events: [...new Set([...events, ...states])] }
}

/** The extension is deployed for the sake of the annotation, which a component need not name. */
export const standalone = true

function read(annotation: Annotation): Pick<Settings, 'store' | 'retention' | 'ingest'> {
  if (new URL(annotation.store.url).pathname.replace(/\//g, '') === '')
    throw new Error(
      'The store of chronicles names no database: the path of its address is the database.'
    )

  return {
    store: annotation.store,
    retention: annotation.retention,
    ingest: annotation.ingest === true
  }
}

/** The user the store is provisioned as, and the password of the reader it creates. */
function credentials(): Variable[] {
  return KEYS.map((key) => ({
    name: `${SETTINGS}_STORE_${key.toUpperCase()}`,
    secret: { name: SECRET, key }
  }))
}

const KEYS = ['username', 'password', 'reader']
const NONE: Declaration = { events: [], identity: null }
