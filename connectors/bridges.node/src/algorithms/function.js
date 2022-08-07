'use strict'

/** @type {toa.node.define.algorithms.Constructor} */
const create = (func, context) => {
  const run = (input, state) => func(input, state, context)

  return { run }
}

exports.create = create
