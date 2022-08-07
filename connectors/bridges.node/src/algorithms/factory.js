'use strict'

/** @type {toa.node.define.algorithms.Constructor} */
const create = (Factory, context) => {
  const factory = new Factory(context)

  return factory.create()
}

exports.create = create
