import { createVariables, type URIMap, type Request } from '@toa.io/pointer'
import { Aspect } from './Aspect'
import { Connection } from './Connection'
import type { Locator, extensions } from '@toa.io/core'
import type { context } from '@toa.io/norm'
import type { Dependency } from '@toa.io/operations'

export class Factory implements extensions.Factory {
  public aspect (locator: Locator): extensions.Aspect {
    const connection = new Connection(locator)

    return new Aspect(connection)
  }
}

export function deployment (instances: context.Dependency[], annotation: URIMap): Dependency {
  const requests: Request[] = instances.map((instance) => createRequest(instance))
  const variables = createVariables(ID, annotation, requests)

  return { variables }
}

function createRequest (instance: context.Dependency): Request {
  return {
    group: instance.locator.label,
    selectors: [instance.locator.id]
  }
}

export const ID = 'stash'
