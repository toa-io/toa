'use strict'

const { Locator } = require('../../runtime/core/src/locator')

const consume = async (binding, domain, name) => {
  const locator = new Locator({ domain, name })
  const consumer = factory(binding).consumer(locator)

  await consumer.connect()

  return consumer
}

const factories = {}

const factory = (binding) => {
  if (!factories[binding]) {
    factories[binding] = new (require(`../../connectors/bindings.${binding}/src/factory`)).Factory()
  }

  return factories[binding]
}

exports.consume = consume
