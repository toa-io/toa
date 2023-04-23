'use strict'

const { PREFIX } = require('../constants')

/**
 * @param {toa.norm.context.dependencies.Instance[]} instances
 * @param {toa.origins.Annotations} annotations
 * @returns {toa.deployment.dependency.Variables}
 */
function uris (instances, annotations) {
  const variables = {}

  for (const [id, annotation] of Object.entries(annotations)) {
    const component = instances.find((instance) => instance.locator.id === id)

    if (component === undefined) throw new Error(`Origins annotations error: component '${id}' is not found`)

    for (const origin of Object.keys(annotation)) {
      if (!(origin in component.manifest)) {
        throw new Error(`Origins annotations error: component '${id}' doesn't have '${origin}' origin`)
      }
    }

    const name = PREFIX + component.locator.uppercase
    const json = JSON.stringify(annotation)
    const value = btoa(json)
    const variable = { name, value }

    variables[component.locator.label] = [variable]
  }

  return variables
}

exports.uris = uris
