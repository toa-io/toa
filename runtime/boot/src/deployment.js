'use strict'

const { deployment: { Factory } } = require('@toa.io/operations')
const { context: load } = require('@toa.io/formation')

/**
 * @param path {string}
 * @returns {Promise<toa.operations.deployment.Operator>}
 */
const deployment = async (path) => {
  const context = await load(path)
  const factory = new Factory(context)

  return factory.operator()
}

exports.deployment = deployment
