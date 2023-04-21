'use strict'

/**
 * @param {toa.norm.context.dependencies.Instance[]} instances
 * @param {toa.origins.Annotations} annotations
 * @returns {toa.deployment.dependency.Declaration}
 */
function deployment (instances, annotations) {
  const variables = {}

  for (const [id, annotation] of Object.entries(annotations)) {
    const component = instances.find((instance) => instance.locator.id === id)
    const name = PREFIX + component.locator.uppercase
    const json = JSON.stringify(annotation)
    const value = btoa(json)
    const variable = { name, value }

    variables[component.locator.label] = [variable]
  }

  return { variables }
}

const PREFIX = 'TOA_ORIGINS_'

exports.deployment = deployment
