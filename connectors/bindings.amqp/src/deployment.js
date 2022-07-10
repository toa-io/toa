'use strict'

const { merge } = require('@toa.io/libraries/generic')
const connectors = require('@toa.io/libraries/connectors')

const { PREFIX } = require('./constants')
const { system } = require('./.deployment')

/**
 * @type {toa.deployment.dependency.Constructor}
 */
const deployment = (instances, annotation) => {
  if (annotation === undefined) {
    throw new Error('AMQP deployment requires either \'system\' or \'default\' URI annotation')
  }

  const deployment = connectors.deployment(instances, annotation, PREFIX)

  const proxy = system.proxy(annotation)
  const variables = system.variables(instances, annotation)

  deployment.proxies.push(proxy)
  merge(deployment.variables, variables)

  return deployment
}

exports.deployment = deployment
