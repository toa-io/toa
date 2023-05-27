'use strict'

const { deployment: { Factory } } = require('@toa.io/operations')
const { context: load } = require('@toa.io/norm')

/**
 * @param {string} path
 * @param {string} [environment]
 * @returns {Promise<toa.deployment.Operator>}
 */
const deployment = async (path, environment) => {
  const factory = await getFactory(path, environment)

  return factory.operator()
}

/**
 * @param {string} path
 * @returns {Promise<toa.deployment.Registry>}
 */
const registry = async (path) => {
  const factory = await getFactory(path)

  return factory.registry()
}

async function getFactory (path, environment) {
  const context = await load(path, environment)

  return new Factory(context)
}

exports.deployment = deployment
exports.registry = registry
