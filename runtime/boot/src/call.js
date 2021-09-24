'use strict'

const { Call, Transmission } = require('@kookaburra/core')

const boot = require('./index')

const call = (locator, manifest, endpoint, definition) => {
  const consumers = boot.bindings.consume(locator)
  const transmission = new Transmission(consumers, endpoint)
  const contract = boot.contract.request(manifest.entity, definition)

  return new Call(transmission, contract)
}

exports.call = call
