'use strict'

const { createVariables } = require('@toa.io/pointer')

const deployment = (instances, annotation) => {
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

const ID = 'mongodb'

exports.ID = ID
exports.deployment = deployment
