'use strict'

const { encode } = require('@toa.io/generic')

function variables (components, annotations) {
  if (annotations === undefined) return {}

  /** @type {toa.deployment.dependency.Variables} */
  const variables = {}

  for (const [id, annotation] of Object.entries(annotations)) {
    const component = components.find((component) => component.locator.id === id)

    variables[component.locator.label] = [{
      name: 'TOA_CONFIGURATION_' + component.locator.uppercase,
      value: encode(annotation)
    }]
  }

  return variables
}

exports.variables = variables
