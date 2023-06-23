import { uris } from '@toa.io/pointer'
import { Aspect } from './Aspect'
import { Connection } from './Connection'
import type { Locator, extensions } from '@toa.io/core'
import type { context } from '@toa.io/norm'
import type * as operations from '@toa.io/operations'

export class Factory implements extensions.Factory {
  public aspect (locator: Locator): extensions.Aspect {
    const url = this.url()
    const connection = new Connection(url, locator)

    return new Aspect(connection)
  }

  private url (): string {
    if (process.env.TOA_DEV === '1') return 'redis://localhost'

    const url = process.env[URL_VARIABLE]

    if (url === undefined) throw new Error(`${URL_VARIABLE} is not set`)

    return url
  }
}

export function deployment (instances: context.Dependency[], annotation: Annotation): Dependency {
  const pointer = uris.construct(annotation)
  const variables: Variables = {}

  for (const instance of instances) {
    const resolution = uris.resolve(instance.locator, pointer)
    const variable: Variable = { name: URL_VARIABLE, value: resolution.url.href }

    variables[instance.locator.label] = [variable]
  }

  return { variables }
}

const URL_VARIABLE = 'TOA_STASH'

type Dependency = operations.deployment.Dependency
type Variables = operations.deployment.Variables
type Variable = operations.deployment.Variable
type Annotation = uris.URIs | string
