'use strict'

const { Exposition, Locator } = require('@toa.io/core')

const boot = require('./index')

const exposition = async (manifest) => {
  const locator = new Locator('', '')
  const exposition = new Exposition(locator, manifest)
  const producers = boot.bindings.expose(exposition)

  await Promise.all(producers.map((producer) => producer.connect()))

  return producers
}

exports.exposition = exposition
