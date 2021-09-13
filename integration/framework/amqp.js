'use strict'

const { Locator } = require('../../runtime/core/src/locator')
const { Factory } = require('../../connectors/bindings.amqp/src/factory')

const consume = async (domain, name) => {
  const locator = new Locator({ domain, name })
  const factory = new Factory()
  const consumer = factory.consumer(locator)

  await consumer.connect()

  return consumer
}

exports.consume = consume
