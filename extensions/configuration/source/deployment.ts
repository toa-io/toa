import assert from 'node:assert'
import { type Dependency, type Resources, type Service, type Variable, type Variables } from '@toa.io/operations'
import { components } from './Composition.js'
import { EVENT, PREFIX, SECRET_RX, UI_PATH, UI_PORT, VALUES } from './const.js'
import { epoch } from './epoch.js'
import * as validators from './schemas.js'
import type { Manifest } from './manifest.js'
import type { context } from '@toa.io/norm'

export function deployment (instances: Instance[], annotation: Annotation = {}): Dependency {
  const { resources, values } = split(annotation)

  annotation = prepare(values, instances)

  const variables: Variables = {}

  for (const instance of instances) {
    const values = annotation[instance.locator.id]

    if (values === undefined)
      continue

    const secrets = createSecrets(values)

    if (secrets.length > 0)
      variables[instance.locator.label] = secrets
  }

  const service: Service = {
    group: 'configuration',
    name: 'values',
    version: require('../package.json').version,
    components: components().labels,
    resources,
    // the service that holds the values also serves the page that reads them
    port: UI_PORT,
    ingress: { path: UI_PATH },
    variables: [{
      name: VALUES,
      value: JSON.stringify(describe(instances, annotation))
    }]
  }

  return { services: [service], variables, events: [EVENT] }
}

/** What the values service is given: the epoch, the schema and the defaults of every component. */
export function describe (instances: Instance[], annotation: Annotation = {}): Values {
  annotation = prepare(split(annotation).values, instances)

  const values: Values = {}

  for (const { locator, manifest } of instances)
    values[locator.id] = {
      epoch: epoch(manifest.schema),
      schema: manifest.schema,
      defaults: annotation[locator.id] ?? manifest.defaults
    }

  return values
}

function createSecrets (values: object): Variable[] {
  const secrets: Variable[] = []

  for (const value of Object.values(values)) {
    if (typeof value === 'object' && value !== null)
      secrets.push(...createSecrets(value as object))

    if (typeof value !== 'string') continue

    const match = value.match(SECRET_RX)

    if (match === null) continue

    const name = match.groups?.variable

    assert.ok(name !== undefined)

    secrets.push({
      name: PREFIX + '_' + name,
      secret: {
        name: 'toa-configuration',
        key: name
      }
    })
  }

  return secrets
}

/**
 * The service's own resources, and the component values that are the rest of the annotation.
 *
 * Every key here names a component, so the one option the service has of its own needs a
 * name that cannot be mistaken for one. `resources` is reserved: a component actually
 * called that is written with its namespace, `default.resources`, which is what an id is
 * anyway — the bare form is the shorthand.
 */
function split (annotation: Annotation): { resources?: Resources, values: Annotation } {
  validators.annotation.validate(annotation)

  const { resources, ...values } = annotation as Annotation & { resources?: Resources }

  return { resources, values }
}

/** Validated, keyed by full component ids, and checked against the components that ask. */
function prepare (annotation: Annotation, instances: Instance[]): Annotation {
  const normalized: Annotation = {}
  const requested = instances.map((instance) => instance.locator.id)

  for (const [key, values] of Object.entries(annotation)) {
    const id = key.includes('.') ? key : 'default.' + key

    assert.ok(requested.includes(id),
      `Component '${id}' does not request configuration or does not exist.`)

    normalized[id] = values
  }

  return normalized
}

export type Annotation = Record<string, any>
export type Instance = context.Dependency<Manifest>
export type Values = Record<string, Entry>

export interface Entry {
  epoch: string
  schema: object
  defaults?: object
}
