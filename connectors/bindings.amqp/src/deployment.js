'use strict'

const { Locator } = require('@toa.io/core')
const { uris } = require('@toa.io/libraries/annotations')

/**
 * @type {toa.operations.deployment.dependency.Constructor}
 */
const deployment = (instances, annotations) => {
  /** @type {toa.operations.deployment.Dependency} */
  const deployment = {}
  const sys = system(annotations)

  deployment.proxies = proxies(instances, annotations)
  deployment.proxies.push(sys)

  return deployment
}

/**
 * @param {toa.annotations.URIs} annotation
 * @returns {toa.operations.deployment.dependency.Proxy}
 */
function system (annotation) {
  if (annotation === undefined) throw new Error('AMQP deployment requires either \'system\' or \'default\' URI annotation')

  const locator = new Locator(SYSTEM)
  const name = locator.hostname(PREFIX)
  const url = uris.resolve(annotation, locator)
  const target = url.hostname

  if (target === undefined) throw new Error('AMQP \'system\' URI annotation is mandatory')

  return { name, target }
}

/**
 * @param {toa.norm.context.dependencies.Instance[]} instances
 * @param {toa.annotations.URIs} annotation
 * @returns {toa.operations.deployment.dependency.Proxy[]}
 */
const proxies = (instances, annotation) => {
  return instances.map((instance) => {
    const url = uris.resolve(annotation, instance.locator)
    const target = url.hostname
    const name = instance.locator.hostname(PREFIX)

    return { name, target }
  })
}

const PREFIX = 'bindings-amqp'
const SYSTEM = 'system'

exports.deployment = deployment
