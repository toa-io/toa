import * as assert from 'node:assert'
import { encode } from '@toa.io/generic'
import { providers } from './providers'
import { validateAnnotation } from './Annotation'
import type { Annotation } from './Annotation'
import type { Dependency, Variable, Mounts } from '@toa.io/operations'
import type { context } from '@toa.io/norm'

export const ENV_PREFIX = 'TOA_STORAGES'

export function deployment (instances: Instance[], annotation: unknown): Dependency {
  validate(instances, annotation)

  const value = encode(annotation)
  const pointer: Variable = { name: ENV_PREFIX, value }
  const secrets = getSecrets(annotation)
  const mounts = getMounts(instances, annotation)

  const dependency: Dependency = { variables: { global: [pointer, ...secrets] } }

  if (mounts !== null)
    dependency.mounts = mounts

  return dependency
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
        name: `${ENV_PREFIX}_${name}_${secret.name}`.toUpperCase(),
        secret: {
          name: `toa-storages-${name}`,
          key: secret.name,
          optional: secret.optional
        }
      })
  }

  return secrets
}

function getMounts (instances: Instance[], annotation: Annotation): Mounts | null {
  let mounts: Mounts | null = null

  for (const { locator, manifest } of instances)
    for (const name of manifest) {
      const declaration = annotation[name]

      // eslint-disable-next-line max-depth
      if (declaration.provider !== 'fs')
        continue

      // eslint-disable-next-line max-depth
      if (declaration.claim !== undefined) {
        mounts ??= {}
        mounts[locator.label] ??= []

        mounts[locator.label].push({
          name,
          path: declaration.path,
          claim: declaration.claim
        })
      }
    }

  return mounts
}

export type Instance = context.Dependency<string[]>
