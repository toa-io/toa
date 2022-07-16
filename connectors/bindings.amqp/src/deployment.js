'use strict'

const connectors = require('@toa.io/libraries/pointer')

const { PREFIX } = require('./constants')

/**
 * @type {toa.deployment.dependency.Constructor}
 */
const deployment = (instances, annotation) => {
  if (annotation === undefined) {
    throw new Error('AMQP deployment requires either \'system\' or \'default\' URI annotation')
  }

  const prefix = PREFIX
  const extensions = ['system']

  /** @type {toa.pointer.deployment.Options} */
  const options = { prefix, extensions }

  return connectors.deployment(instances, annotation, options)
}

exports.deployment = deployment
