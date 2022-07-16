'use strict'

const pointer = require('@toa.io/libraries/pointer')

const { validate } = require('./.deployment/validate')

/** @type {toa.deployment.dependency.Constructor} */
const deployment = (instances, annotation) => {
  validate(annotation)

  return pointer.deployment(instances, annotation, OPTIONS)
}

const OPTIONS = { prefix: 'storages-sql' }

exports.deployment = deployment
