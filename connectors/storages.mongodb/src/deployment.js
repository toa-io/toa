'use strict'

const connectors = require('@toa.io/libraries/pointer')

/**
 * @param {toa.norm.context.dependencies.Instance[]} instances
 * @param {toa.connectors.URIs} annotation
 * @returns {toa.deployment.dependency.Declaration}
 */
const deployment = (instances, annotation) => {
  if (annotation === undefined) throw new Error('MongoDB URI annotation is required')

  return connectors.deployment(instances, annotation, OPTIONS)
}

/** @type {toa.pointer.deployment.Options} */
const OPTIONS = { prefix: 'storages-mongodb' }

exports.deployment = deployment
