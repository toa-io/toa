'use strict'

const consumer = (locator, binding) => factory(binding).consumer(locator)
const producer = (runtime, binding) => factory(binding).producer(runtime)

const factories = {}

const factory = (binding) => {
  if (!factories[binding]) factories[binding] = new (require(binding).Factory)()

  return factories[binding]
}

exports.consumer = consumer
exports.producer = producer
