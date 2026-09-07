import { createVariables, type Request, type URIMap } from '@toa.io/pointer'
import type { context } from '@toa.io/norm'
import type { Dependency } from '@toa.io/operations'

export function deployment(
  instances: context.Dependency[],
  annotation: URIMap
): Dependency {
  const requests = instances.map((instance) => createRequest(instance))
  const variables = createVariables(ID, annotation, requests)

  return { variables }
}

function createRequest(instance: context.Dependency): Request {
  return {
    group: instance.locator.label,
    selectors: [instance.locator.id]
  }
}

export const ID = 'mongodb'
