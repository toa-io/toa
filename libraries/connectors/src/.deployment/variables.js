'use strict'

const declare = require('./.variables')

/**
 * @param {string} prefix
 * @param {toa.connectors.URIs} uris
 * @returns {toa.deployment.dependency.Variable[]}
 */
const variables = (prefix, uris) => {
  /** @type {toa.deployment.dependency.Variable[]} */
  const variables = []
  const pointer = declare.pointer(prefix, uris)
  const credentials = declare.credentials(prefix, uris)

  variables.push(pointer)
  variables.push(...credentials)

  return variables
}

exports.variables = variables
