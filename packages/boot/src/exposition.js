'use strict'

const { system: { Locator, Exposition } } = require('@kookaburra/runtime')

const boot = require('./index')

const exposition = async (runtime) => {
  const locator = new Locator(runtime.locator, Exposition.endpoints())
  const exposition = new Exposition(locator, runtime)
  const producer = boot.system.producer(exposition)

  await producer.connect()

  return producer
}

exports.exposition = exposition
