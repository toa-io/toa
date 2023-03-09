'use strict'

const connectors = require('@toa.io/pointer')

const { PREFIX } = require('./constants')

/**
 * @type {toa.deployment.dependency.Constructor}
 */
const deployment = (instances, annotation) => {
  validate(annotation)

  /** @type {toa.pointer.deployment.Options} */
  const options = { prefix: PREFIX }

  return connectors.deployment(instances, annotation, options)
}

/**
 * @param {toa.pointer.URIs} annotation
 */
const validate = (annotation) => {
  const defined = annotation !== undefined
  const defaults = defined && (typeof annotation === 'string' || annotation.default !== undefined)
  const correct = defined && (defaults || annotation.system !== undefined)

  if (!correct) {
    throw new Error('AMQP deployment requires either \'system\' or \'default\' pointer annotation')
  }
}

exports.deployment = deployment
