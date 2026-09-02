import assert from 'node:assert'
import { type Dependency, type Service, type Variable, type Variables } from '@toa.io/operations'
import { components } from './Composition'
import { EVENT, PREFIX, SECRET_RX, UI_PATH, UI_PORT, VALUES } from './const'
import { epoch } from './epoch'
import * as validators from './schemas'
import type { Manifest } from './manifest'
import type { context } from '@toa.io/norm'

export function deployment (instances: Instance[], annotation: Annotation = {}): Dependency {
  annotation = prepare(annotation, instances)

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
  annotation = prepare(annotation, instances)

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

/** Validated, keyed by full component ids, and checked against the components that ask. */
function prepare (annotation: Annotation, instances: Instance[]): Annotation {
  validators.annotation.validate(annotation)

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

export type Annotation = Record<string, object>
export type Instance = context.Dependency<Manifest>
export type Values = Record<string, Entry>

export interface Entry {
  epoch: string
  schema: object
  defaults?: object
}
