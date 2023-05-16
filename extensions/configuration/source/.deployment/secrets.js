'use strict'

const find = require('../secrets')

/**
 * @param {toa.norm.context.dependencies.Instance[]} components
 * @param {object} annotations
 * @return {toa.deployment.dependency.Variables}
 */
function secrets (components, annotations) {
  /** @type {toa.deployment.dependency.Variables} */
  const variables = {}

  for (const [id, annotation] of Object.entries(annotations)) {
    const component = components.find((component) => component.locator.id === id)
    const label = component.locator.label

    find.secrets(annotation, (variable, key) => {
      if (variables[label] === undefined) variables[label] = []

      variables[label].push({
        name: variable,
        secret: { name: SECRET_NAME, key }
      })
    })
  }

  return variables
}

const SECRET_NAME = 'toa-configuration'

exports.secrets = secrets
