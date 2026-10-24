import { components } from './components.ts'
import { version } from '../version.ts'
import { ENCOUNTERS, NAMESPACE, SECRET, SERVICE, SETTINGS, view } from './const.ts'
import * as schemas from './schemas.ts'
import type { Annotation, Contract, Declaration, Settings } from './types.ts'
import type { context } from '@toa.io/norm'
import type { Dependency, Service, Variable } from '@toa.io/operations'

/**
 * The events the components declare are consumed, so they are published, and the service consumes
 * them: it is given which they are and their contracts, the contracts of the facts, the store, and
 * the store's credentials, which nothing else is.
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
  }

  distinct(events, states, facts)

  const settings: Settings = {
    ...read(annotation),
    events,
    states,
    facts,
    identities
  }

  const labels = components().labels.filter(
    (label) => settings.encounters || label !== `${NAMESPACE}-${ENCOUNTERS}`
  )

  const service: Service = {
    group: NAMESPACE,
    name: SERVICE,
    version,
    components: labels,
    variables: [{ name: SETTINGS, value: JSON.stringify(settings) }, ...credentials()]
  }

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
): Pick<Settings, 'store' | 'retention' | 'encounters' | 'ip'> {
  if (new URL(annotation.store.url).pathname.replace(/\//g, '') === '')
    throw new Error(
      'The store of chronicles names no database: the path of its address is the database.'
    )

  return {
    store: annotation.store,
    retention: annotation.retention,
    encounters: annotation.encounters === true,
    ip: annotation.ip ?? 'truncated'
  }
}

/**
 * A label is a view by its name with its dots as underscores, and a state by its component's, so
 * two that read as one view are refused here rather than left to replace each other in the store.
 */
function distinct(
  events: Record<string, Contract>,
  states: Record<string, Contract>,
  facts: Record<string, Contract>
): void {
  const seen = new Map<string, string>()
  const components = Object.keys(states).map((label) =>
    label.slice(0, label.lastIndexOf('.'))
  )

  for (const label of [...Object.keys(events), ...Object.keys(facts), ...components]) {
    const name = view(label)
    const other = seen.get(name)

    if (other !== undefined && other !== label)
      throw new Error(
        `Chronicles of '${other}' and '${label}' would both be the view '${name}'.`
      )

    seen.set(name, label)
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
const NONE: Declaration = { events: {}, facts: {}, identity: null }
