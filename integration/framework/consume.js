'use strict'

const { Locator } = require('../../runtime/core/src/locator')

const consume = async (binding, fqn) => {
  const manifest = Locator.split(fqn)
  const locator = new Locator(manifest)
  const consumer = factory(binding).consumer(locator)

  await consumer.connect()

  return consumer
}

const factories = {}

const factory = (binding) => {
  if (!factories[binding]) {
    factories[binding] = new (require(binding)).Factory()
  }

  return factories[binding]
}

exports.consume = consume
