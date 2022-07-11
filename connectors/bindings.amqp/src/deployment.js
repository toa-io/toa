'use strict'

const connectors = require('@toa.io/libraries/connectors')

const { PREFIX } = require('./constants')

/**
 * @type {toa.deployment.dependency.Constructor}
 */
const deployment = (instances, annotation) => {
  if (annotation === undefined) {
    throw new Error('AMQP deployment requires either \'system\' or \'default\' URI annotation')
  }

  return connectors.deployment(PREFIX, instances, annotation, ['system'])
}

exports.deployment = deployment
