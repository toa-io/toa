'use strict'

/** @type {toa.node.define.algorithms.Constructor} */
const create = (Factory) => {
  const factory = new Factory()

  return factory.create()
}

exports.create = create
