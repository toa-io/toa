'use strict'

const { Schema } = require('@toa.io/schema')

/**
 * @param {Object} annotation
 * @param {toa.norm.context.dependencies.Instance[]} instances
 */
const annotation = (annotation, instances) => {
  const keys = Object.keys(annotation)

  check(keys, instances)

  for (const instance of instances) {
    const object = annotation[instance.locator.id] ?? {}
    const schema = new Schema(instance.manifest)

    schema.validate(object)
  }

  return annotation
}

/**
 * @param {string[]} keys
 * @param {toa.norm.context.dependencies.Instance[]} instances
 */
const check = (keys, instances) => {
  const ids = instances.map((instance) => instance.locator.id)

  for (const key of keys) {
    if (!ids.includes(key)) throw new Error(`Configuration Schema '${key}' is not defined`)
  }
}

exports.annotation = annotation
