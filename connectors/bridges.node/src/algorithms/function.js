'use strict'

/** @type {toa.node.define.algorithms.Constructor} */
const create = (func, context) => {
  const execute = (input, state) => func(input, state, context)

  return /** @type {toa.core.bridges.Algorithm} */ { execute }
}

exports.create = create
