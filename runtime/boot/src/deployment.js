'use strict'

const { deployment: { Factory } } = require('@toa.io/operations')
const { context: load } = require('@toa.io/formation')

/**
 * @param {string} path
 * @param {string} [environment]
 * @returns {Promise<toa.operations.deployment.Operator>}
 */
const deployment = async (path, environment) => {
  const context = await load(path, environment)
  const factory = new Factory(context)

  return factory.operator()
}

exports.deployment = deployment
