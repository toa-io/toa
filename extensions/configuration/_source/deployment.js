'use strict'

const { merge } = require('@toa.io/generic')
const get = require('./.deployment')

/**
 * @param {toa.norm.context.dependencies.Instance[]} components
 * @param {object} annotations
 * @return {toa.deployment.dependency.Declaration}
 */
const deployment = (components, annotations) => {
  const variables = get.variables(components, annotations)
  const secrets = get.secrets(components, annotations)

  merge(variables, secrets)

  return { variables }
}

exports.deployment = deployment
