'use strict'

const { Call, Transmission } = require('@kookaburra/core')

const boot = require('./index')

const call = (locator, descriptor, bindings) => {
  const consumers = boot.bindings.consume(locator, bindings)
  const transmission = new Transmission(descriptor, consumers)
  const contract = boot.contract.request(locator.entity, descriptor)

  return new Call(transmission, contract)
}

exports.call = call
