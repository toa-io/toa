'use strict'

const pointer = require('@toa.io/libraries/pointer')

/** @type {toa.deployment.dependency.Constructor} */
const deployment = (instances, annotation) => {
  if (annotation === undefined) throw new Error('SQL pointer annotation is required')

  const options = { prefix }

  return pointer.deployment(instances, annotation, options)
}

const prefix = 'storages-sql'

exports.deployment = deployment
