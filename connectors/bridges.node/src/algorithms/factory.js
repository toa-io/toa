'use strict'

const create = (Factory) => {
  const factory = new Factory()

  return factory.create()
}

exports.create = create
