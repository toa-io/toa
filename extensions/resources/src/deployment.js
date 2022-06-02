'use strict'

const { PORT } = require('./constants')

/**
 * @returns {toa.operations.deployment.dependency.Declaration}
 */
const deployment = () => {
  const group = 'resources'

  /** @type {string} */
  const version = require('../package.json').version

  /** @type {toa.operations.deployment.dependency.Service} */
  const exposition = { group, name: 'exposition', version, port: PORT }

  return { services: [exposition] }
}

exports.deployment = deployment
