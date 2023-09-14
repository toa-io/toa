'use strict'

const { extract } = require('./extract')
const syntaxes = require('./syntaxes')

/**
 * @param {Object} module
 * @returns {toa.node.define.operations.Definition}
 */
const define = (module) => {
  const descriptor = extract(module)

  if (descriptor === null)
    return null

  return syntaxes[descriptor.syntax].define(descriptor)
}

exports.define = define
