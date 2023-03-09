'use strict'

const pointer = require('@toa.io/pointer')

/** @type {toa.deployment.dependency.Constructor} */
const deployment = (instances, annotation) => {
  if (annotation === undefined) throw new Error('MongoDB pointer annotation is required')

  return pointer.deployment(instances, annotation, OPTIONS)
}

/** @type {toa.pointer.deployment.Options} */
const OPTIONS = { prefix: 'storages-mongodb' }

exports.deployment = deployment
