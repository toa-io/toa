'use strict'

const { io, Call, Query, Transmission } = require('@kookaburra/core')
const { Schema } = require('@kookaburra/schema')

const boot = require('./index')

const call = (locator, operation, bindings) => {
  const input = new Schema(operation.input)
  const output = new Schema(operation.output)
  const error = new Schema(io.error.schema)

  const channels = new io.Factory({ input, output, error })
  const query = new Query(locator.entity?.properties)

  const consumers = boot.bindings.consume(locator, bindings)
  const transmission = new Transmission(operation, consumers)

  return new Call(transmission, channels, query)
}

exports.call = call
