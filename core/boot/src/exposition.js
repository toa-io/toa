'use strict'

const { Exposition } = require('@kookaburra/runtime')

const boot = require('./index')

const exposition = async (runtime) => {
  const exposition = new Exposition(runtime)
  const producer = boot.bindings.expose(exposition)

  await producer.connect()

  return producer
}

exports.exposition = exposition
