'use strict'

const { io, Call, Query, Transmission } = require('@kookaburra/runtime')
const { Schema } = require('@kookaburra/schema')

const boot = require('./index')

const call = (locator, operation) => {
  const input = new Schema(operation.input)
  const output = new Schema(operation.output)
  const error = new Schema(io.error.schema)

  const channels = new io.Factory({ input, output, error })
  const query = new Query(locator.entity?.properties)

  const bindings = boot.bindings.consume(locator)
  const transmission = new Transmission(operation, bindings)

  return new Call(transmission, channels, query)
}

exports.call = call
