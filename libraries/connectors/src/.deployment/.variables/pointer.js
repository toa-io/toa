'use strict'

const { encode, letters: { up } } = require('@toa.io/libraries/generic')

/**
 * @param {string} prefix
 * @param {toa.connectors.URIs} uris
 * @returns {toa.deployment.dependency.Variable}
 */
const pointer = (prefix, uris) => {
  const name = `TOA_${up(prefix)}_POINTER`
  const json = JSON.stringify(uris)
  const value = encode(json)

  return { name, value }
}

exports.pointer = pointer
