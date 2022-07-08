'use strict'

const { uris } = require('@toa.io/libraries/annotations')

/**
 * @param {toa.norm.context.dependencies.Instance[]} instances
 * @param {toa.annotations.URIs} annotation
 * @returns {toa.operations.deployment.dependency.Declaration}
 */
const deployment = (instances, annotation) => {
  if (annotation === undefined) throw new Error('MongoDB URI annotation is required')

  const proxies = instances.map((instance) => proxy(instance, annotation))

  return { proxies }
}

/**
 * @param {toa.norm.context.dependencies.Instance} component
 * @param {toa.annotations.URIs} annotation
 * @returns {toa.operations.deployment.dependency.Proxy}
 */
const proxy = (component, annotation) => {
  const name = component.locator.hostname(PREFIX)
  const url = uris.resolve(annotation, component.locator)
  const target = url.hostname

  return { name, target }
}

const PREFIX = 'storages-mongodb'

exports.deployment = deployment
