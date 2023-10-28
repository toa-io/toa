import { encode } from 'msgpackr'
import { providers } from './providers'
import type { Dependency, Variable } from '@toa.io/operations'
import type { context } from '@toa.io/norm'

export function deployment (instances: Instance[], annotation: Annotation): Dependency {
  validate(instances, annotation)

  const value = encode(annotation).toString('base64')
  const pointer: Variable = { name: 'TOA_STORAGES', value }
  const secrets = getSecrets(annotation)

  return {
    variables: { global: [pointer, ...secrets] }
  }
}

function validate (instances: Instance[], annotation: Annotation): void {
  for (const instance of instances)
    contains(instance, annotation)

  for (const ref of Object.values(annotation)) {
    const url = new URL(ref)

    if (!(url.protocol in providers))
      throw new Error(`Unknown storage provider '${url.protocol}'`)
  }
}

function contains (instance: Instance, annotation: Annotation): void {
  for (const name of instance.manifest)
    if (!(name in annotation))
      throw new Error(`Missing '${name}' storage annotation ` +
        `declared in '${instance.component.locator.id}'`)
}

function getSecrets (annotation: Annotation): Variable[] {
  const secrets: Variable[] = []

  for (const [storage, ref] of Object.entries(annotation)) {
    const url = new URL(ref)
    const Provider = providers[url.protocol]

    if (Provider.SECRETS === undefined)
      continue

    for (const secret of Provider.SECRETS)
      secrets.push({
        name: `TOA_STORAGES_${storage.toUpperCase()}_${secret.toUpperCase()}`,
        secret: {
          name: `toa-storages-${storage}`,
          key: secret
        }
      } satisfies Variable)
  }

  return secrets
}

type Annotation = Record<string, string>
export type Instance = context.Dependency<string[]>
