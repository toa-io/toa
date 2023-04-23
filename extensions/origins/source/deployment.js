'use strict'

const schemas = require('./schemas')
const create = require('./.deployment')

/**
 * @param {toa.norm.context.dependencies.Instance[]} instances
 * @param {toa.origins.Annotations} annotations
 * @returns {toa.deployment.dependency.Declaration}
 */
function deployment (instances, annotations) {
  schemas.annotations.validate(annotations)

  const uris = create.uris(instances, annotations)
  const variables = { ...uris }

  return { variables }
}

exports.deployment = deployment
