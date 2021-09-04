'use strict'

const producer = (runtimes, bindings) => {
  return bindings.map((binding) => {
    const { Factory } = require(binding)
    const factory = new Factory()

    return factory.producer(runtimes)
  })
}

exports.producer = producer
