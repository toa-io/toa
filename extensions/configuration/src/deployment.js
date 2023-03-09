'use strict'

const { encode } = require('@toa.io/generic')

/**
 * @type {toa.deployment.dependency.Constructor}
 */
const deployment = (components, annotations) => {
  const variables = {}

  for (const [id, annotation] of Object.entries(annotations)) {
    const component = components.find((component) => component.locator.id === id)

    variables[component.locator.label] = [{
      name: 'TOA_CONFIGURATION_' + component.locator.uppercase,
      value: encode(annotation)
    }]
  }

  return { variables }
}

exports.deployment = deployment
