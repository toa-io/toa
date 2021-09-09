'use strict'

const bindings = require('./bindings')

const producer = (runtime) => {
  return bindings.producer(runtime, BINDING)
}

const consumer = (locator) => {
  return bindings.consumer(locator, BINDING)
}

const BINDING = '@kookaburra/bindings.amqp'

exports.producer = producer
exports.consumer = consumer
