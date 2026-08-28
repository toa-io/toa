'use strict'

const { Call, Transmission } = require('@toa.io/core')

const boot = require('./index')

// eslint-disable-next-line max-params
const call = (locator, endpoint, definition, entity, source) => {
  const consumers = boot.bindings.consume(locator, endpoint, definition.bindings)
  const transmission = new Transmission(consumers)
  const contract = boot.contract.request(definition, entity)

  return new Call(transmission, contract, source)
}

exports.call = call
