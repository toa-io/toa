'use strict'

const { createVariables } = require('@toa.io/pointer')
const { validate } = require('./.deployment/validate')

/** @type {toa.deployment.dependency.Constructor} */
const deployment = (instances, annotation) => {
  validate(annotation)

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

const ID = 'sql'

exports.ID = ID
exports.deployment = deployment
