import { components } from './components.ts'
import { version } from '../version.ts'
import { BROKER_KEYS, KEYS, NAMESPACE, SECRET, SERVICE, SETTINGS } from './const.ts'
import * as schemas from './schemas.ts'
import type { Annotation, Contract, Declaration, Settings } from './types.ts'
import type { context } from '@toa.io/norm'
import type { Dependency, Service, Variable } from '@toa.io/operations'

/**
 * The events the components declare are consumed, so they are published, and the service consumes
 * them: it is given which they are and their contracts, the contracts of the facts, the store, and
 * the credentials of the broker and of the store, which nothing else is. A context that names no
 * store writes the log and does not read it: it has no queries, and no user of a store.
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

  const events: Record<string, Contract> = {}
  const states: Record<string, Contract> = {}
  const facts: Record<string, Contract> = {}
  const identities: Record<string, string> = {}
  const timestamps: Record<string, string | null> = {}

  for (const instance of declaring) {
    const declaration = (instance.manifest as unknown as Declaration | undefined) ?? NONE
    const id = instance.locator.id

    for (const [event, contract] of Object.entries(declaration.events))
      events[`${id}.${event}`] = contract

    if (declaration.state !== undefined) {
      const { event, ...contract } = declaration.state

      states[`${id}.${event}`] = contract
    }

    for (const [fact, contract] of Object.entries(declaration.facts))
      facts[`${id}.${fact}`] = contract

    if (declaration.identity !== null) identities[id] = declaration.identity

    timestamps[id] = declaration.timestamp
  }

  const settings: Settings = {
    ...read(annotation),
    events,
    states,
    facts,
    identities,
    timestamps
  }

  const { labels } = components(annotation)

  const service: Service = {
    group: NAMESPACE,
    name: SERVICE,
    version,
    components: labels,
    variables: [
      { name: SETTINGS, value: JSON.stringify(settings) },
      ...credentials(annotation.store === undefined ? BROKER_KEYS : KEYS)
    ]
  }

  if (annotation.resources !== undefined) service.resources = annotation.resources

  // a state's event is consumed as an event's is
  return {
    services: [service],
    events: [...new Set([...Object.keys(events), ...Object.keys(states)])]
  }
}

/** The extension is deployed for the sake of the annotation, which a component need not name. */
export const standalone = true

function read(
  annotation: Annotation
): Pick<Settings, 'broker' | 'store' | 'retention' | 'encounters' | 'ip'> {
  // what is read is the user's own: the address names a server, and no database of it
  if (
    annotation.store !== undefined &&
    new URL(annotation.store.url).pathname.replace(/\//g, '') !== ''
  )
    throw new Error(
      "The store of chronicles is the address of a server: what is read is its user's."
    )

  return {
    broker: annotation.broker,
    store: annotation.store,
    retention: annotation.retention,
    encounters: annotation.encounters === true,
    ip: annotation.ip ?? 'truncated'
  }
}

/** The users of the broker and, where the log is read, of the store, from the secret. */
function credentials(keys: string[]): Variable[] {
  return keys.map((key) => ({
    name: `${SETTINGS}_${key.toUpperCase()}`,
    secret: { name: SECRET, key }
  }))
}

const NONE: Declaration = { events: {}, facts: {}, identity: null, timestamp: null }
