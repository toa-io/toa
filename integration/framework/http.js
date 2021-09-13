'use strict'

const { Locator } = require('../../runtime/core/src/locator')
const { Factory } = require('../../connectors/bindings.http/src/factory')

const factory = new Factory()

const consume = async (domain, name) => {
  const locator = new Locator({ domain, name })
  const consumer = factory.consumer(locator)

  await consumer.connect()

  return consumer
}

exports.consume = consume
