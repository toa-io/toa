import assert from 'node:assert'
import { type Dependency, type Variable, type Variables } from '@toa.io/operations'
import { encode } from '@toa.io/generic'
import { type Manifest } from './manifest'
import * as validators from './schemas'
import type { context } from '@toa.io/norm'

export function deployment (instances: Instance[], annotation: Annotation = {}): Dependency {
  validate(annotation, instances)

  const variables: Variables = {}

  for (const instance of instances) {
    const values = annotation[instance.locator.id]

    if (values === undefined)
      continue

    variables[instance.locator.label] = [{
      name: PREFIX + instance.locator.uppercase,
      value: encode(values)
    }]

    const secrets = createSecrets(values)

    variables[instance.locator.label].push(...secrets)
  }

  return { variables }
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

function validate (annotation: Annotation, instances: Instance[]): void {
  validators.annotation.validate(annotation)

  const requested = instances.map((instance) => instance.locator.id)

  for (let id of Object.keys(annotation)) {
    if (!id.includes('.')) {
      const newid = 'default.' + id

      annotation[newid] = annotation[id]
      delete annotation[id]
      id = newid
    }

    assert.ok(requested.includes(id),
      `Component '${id}' does not request configuration or does not exist.`)
  }
}

export const SECRET_RX = /^\$(?<variable>[A-Z0-9_]{1,32})$/
export const PREFIX = 'TOA_CONFIGURATION_'

export type Annotation = Record<string, object>
export type Instance = context.Dependency<Manifest>
