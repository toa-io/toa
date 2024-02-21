import * as assert from 'node:assert'
import { encode } from '@toa.io/generic'
import { providers } from './providers'
import { validateAnnotation } from './Annotation'
import type { Annotation } from './Annotation'
import type { Dependency, Variable } from '@toa.io/operations'
import type { context } from '@toa.io/norm'

export const SERIALIZATION_PREFIX = 'TOA_STORAGES'

export function deployment (instances: Instance[], annotation: unknown): Dependency {
  validate(instances, annotation)

  const value = encode(annotation)
  const pointer: Variable = { name: SERIALIZATION_PREFIX, value }
  const secrets = getSecrets(annotation)

  return {
    variables: { global: [pointer, ...secrets] }
  }
}

function validate (instances: Instance[], annotation: unknown): asserts annotation is Annotation {
  validateAnnotation(annotation)

  for (const instance of instances)
    contains(instance, annotation)
}

function contains (instance: Instance, annotation: Annotation): void {
  for (const name of instance.manifest)
    assert.ok(name in annotation,
      `Missing '${name}' storage annotation ` +
      `declared in '${instance.component.locator.id}'`)
}

function getSecrets (annotation: Annotation): Variable[] {
  const secrets: Variable[] = []

  for (const [name, declaration] of Object.entries(annotation)) {
    const Provider = providers[declaration.provider]

    for (const secret of Provider.SECRETS)
      secrets.push({
        name: `${SERIALIZATION_PREFIX}_${name}_${secret.name}`.toUpperCase(),
        secret: {
          name: `toa-storages-${name}`,
          key: secret.name,
          optional: secret.optional
        }
      })
  }

  return secrets
}

export type Instance = context.Dependency<string[]>
