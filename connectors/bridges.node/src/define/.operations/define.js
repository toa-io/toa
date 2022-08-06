'use strict'

const { extract } = require('./extract')

const definitions = [
  require('./function').define,
  require('./class').define,
  require('./factory').define
]

/**
 * @param {Object} module
 * @returns {toa.node.define.operations.Definition}
 */
const define = (module) => {
  /** @type {toa.node.define.operations.Definition} */
  let definition = {}

  const [name, statement] = extract(module)

  for (const define of definitions) {
    definition = define(statement, name)

    if (definition !== null) return definition
  }

  throw new Error('Exported function does not match conventions')
}

exports.define = define
