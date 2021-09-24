'use strict'

const { Call, Transmission } = require('@kookaburra/core')

const boot = require('./index')

const call = (locator, endpoint, definition, bindings) => {
  const consumers = boot.bindings.consume(locator, bindings)
  const transmission = new Transmission(endpoint, consumers)
  const contract = boot.contract.request(locator.entity, definition)

  return new Call(transmission, contract)
}

exports.call = call
