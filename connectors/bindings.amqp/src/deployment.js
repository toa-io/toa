'use strict'

const { Locator } = require('@toa.io/core')
const connectors = require('@toa.io/libraries/connectors')

const { PREFIX, SYSTEM } = require('./constants')

const { resolve } = connectors.uris

/**
 * @type {toa.deployment.dependency.Constructor}
 */
const deployment = (instances, annotation) => {
  if (annotation === undefined) {
    throw new Error('AMQP deployment requires either \'system\' or \'default\' URI annotation')
  }

  const deployment = connectors.deployment(instances, annotation, PREFIX)
  const sys = system(annotation)

  deployment.proxies.push(sys)

  return deployment
}

/**
 * @param {toa.connectors.URIs} annotation
 * @returns {toa.deployment.dependency.Proxy}
 */
function system (annotation) {
  const locator = new Locator(SYSTEM)
  const name = locator.hostname(PREFIX)
  const url = resolve(annotation, locator)
  const target = url.hostname

  if (target === undefined) throw new Error('AMQP \'system\' URI annotation is mandatory')

  return { name, target }
}

exports.deployment = deployment
