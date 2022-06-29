'use strict'

/**
 * @param {toa.formation.component.Brief[]} components
 * @param {toa.storages.mongo.Annotations} annotations
 * @returns {toa.operations.deployment.dependency.Declaration}
 */
const deployment = (components, annotations) => {
  if (annotations === undefined) throw new Error('storages.mongodb annotation is required')

  const proxies = components.map((component) => proxy(component, annotations))

  return { proxies }
}

/**
 * @param {toa.formation.component.Brief} component
 * @param {toa.storages.mongo.Annotations} annotations
 * @returns {toa.operations.deployment.dependency.Proxy}
 */
const proxy = (component, annotations) => {
  const name = PREFIX + component.locator.label
  const target = extract(annotations, [component.locator.namespace, component.locator.name])

  return { name, target }
}

/**
 * @param {toa.storages.mongo.Annotations} annotations
 * @param {string[]} segments
 * @returns {string}
 */
const extract = (annotations, segments) => {
  const name = segments.join('.')

  let value
  let cursor = annotations

  while ((cursor = cursor[segments.shift()]) !== undefined) value = cursor

  if (value === undefined) value = annotations.default
  if (value === undefined) throw new Error(`MongoDB annotation for '${name}' hasn't been found`)

  return value
}

const PREFIX = 'storages-mongodb-'

exports.deployment = deployment
