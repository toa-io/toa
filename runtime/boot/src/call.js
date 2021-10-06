'use strict'

const { Call, Transmission } = require('@kookaburra/core')

const boot = require('./index')

const call = (locator, endpoint, definition) => {
  const consumers = boot.bindings.consume(locator, endpoint, definition.bindings)
  const transmission = new Transmission(consumers)
  const contract = boot.contract.request(definition)

  return new Call(transmission, contract)
}

exports.call = call
