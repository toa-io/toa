'use strict'

const { createVariables } = require('@toa.io/pointer')
const { PREFIX } = require('./constants')

const deployment = (instances, annotation) => {
  const request = createRequest(instances)
  const variables = createVariables(PREFIX, annotation, [request])

  return { variables }
}

function createRequest (instances) {
  const selectors = createSelectors(instances)

  selectors.push('system')

  return { group: 'global', selectors }
}

function createSelectors (instances) {
  return instances.map((instance) => instance.locator.id)
}

exports.deployment = deployment
