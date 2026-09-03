import { createVariables } from '@toa.io/pointer'

export const deployment = (instances, annotation) => {
  const requests = instances.map((instance) => createRequest(instance))
  const variables = createVariables(ID, annotation, requests)

  return { variables }
}

function createRequest (instance) {
  return {
    group: instance.locator.label,
    selectors: [instance.locator.id]
  }
}

export const ID = 'mongodb'
