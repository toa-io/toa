'use strict'

const producers = (runtimes, bindings) => {
  return bindings.map((binding) => {
    const { Factory } = require(binding)
    const factory = new Factory()

    return runtimes.map((runtime) => factory.producer(runtime))
  }).flat()
}

exports.producers = producers
