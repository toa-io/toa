import * as assert from 'node:assert'
import { encode } from 'msgpackr'
import { providers } from './providers'
import type { Dependency, Variable } from '@toa.io/operations'
import type { context } from '@toa.io/norm'

export const SERIALIZATION_PREFIX = 'TOA_STORAGES'

export function deployment (instances: Instance[], annotation: Annotation): Dependency {
  validate(instances, annotation)

  const value = encode(annotation).toString('base64')
  const pointer: Variable = { name: SERIALIZATION_PREFIX, value }
  const secrets = getSecrets(annotation)

  return {
    variables: { global: [pointer, ...secrets] }
  }
}

function validate (instances: Instance[], annotation: Annotation): void {
  assert.ok(annotation !== undefined,
    `Storages annotation is required by: '${instances
      .map((i) => i.component.locator.id)
      .join("', '")}'`)

  for (const instance of instances) contains(instance, annotation)

  for (const { provider } of Object.values(annotation))
    validateProviderId(provider)
}

function contains (instance: Instance, annotation: Annotation): void {
  for (const name of instance.manifest)
    assert.ok(name in annotation,
      `Missing '${name}' storage annotation ` +
        `declared in '${instance.component.locator.id}'`)
}

export function validateProviderId (id: string | undefined): asserts id is keyof typeof providers {
  assert.ok(typeof id === 'string' && id in providers, `Unknown storage provider '${id}'`)
}

function getSecrets (annotation: Readonly<Annotation>): Variable[] {
  const secrets: Variable[] = []

  for (const [storage, props] of Object.entries(annotation)) {
    const providerId = props.provider

    validateProviderId(providerId)

    const Provider = providers[providerId]

    if (Provider.SECRETS.length === 0) continue

    for (const secret of Provider.SECRETS)
      secrets.push({
        name: `${SERIALIZATION_PREFIX}_${storage.toUpperCase()}_${secret.name.toUpperCase()}`,
        secret: {
          name: `toa-storages-${storage}`,
          key: secret.name,
          optional: secret.optional
        }
      })
  }

  return secrets
}

type Annotation = Record<string, { [k: string]: unknown, provider: string }>
export type Instance = context.Dependency<string[]>
