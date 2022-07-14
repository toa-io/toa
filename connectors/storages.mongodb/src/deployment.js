'use strict'

const connectors = require('@toa.io/libraries/pointer')

/**
 * @param {toa.norm.context.dependencies.Instance[]} instances
 * @param {toa.connectors.URIs} annotation
 * @returns {toa.deployment.dependency.Declaration}
 */
const deployment = (instances, annotation) => {
  if (annotation === undefined) throw new Error('MongoDB URI annotation is required')

  return connectors.deployment(PREFIX, instances, annotation)
}

const PREFIX = 'storages-mongodb'

exports.deployment = deployment
