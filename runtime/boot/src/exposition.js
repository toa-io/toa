'use strict'

const { Exposition } = require('@kookaburra/core')

const boot = require('./index')

const exposition = async (runtime) => {
  const exposition = new Exposition(runtime)
  const producers = boot.bindings.expose(exposition)

  await Promise.all(producers.map((producer) => producer.connect()))

  return producers
}

exports.exposition = exposition
