'use strict'

const { Exposition } = require('@kookaburra/core')

const boot = require('./index')

const exposition = async (runtime, bindings) => {
  const exposition = new Exposition(runtime.locator)
  const producers = boot.bindings.expose(exposition, bindings)

  await Promise.all(producers.map((producer) => producer.connect()))

  return producers
}

exports.exposition = exposition
