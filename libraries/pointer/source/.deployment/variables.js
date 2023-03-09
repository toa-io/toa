'use strict'

const declare = require('./.variables')

/**
 * @param {toa.pointer.URIs} uris
 * @param {string} prefix
 * @returns {toa.deployment.dependency.Variable[]}
 */
const variables = (uris, prefix) => {
  /** @type {toa.deployment.dependency.Variable[]} */
  const variables = []
  const pointer = declare.pointer(prefix, uris)
  const credentials = declare.credentials(prefix, uris)

  variables.push(pointer)
  variables.push(...credentials)

  return variables
}

exports.variables = variables
