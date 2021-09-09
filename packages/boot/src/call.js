'use strict'

const { io, Call, Query } = require('@kookaburra/runtime')
const { Schema } = require('@kookaburra/schema')

const call = (endpoint) => {
  const input = new Schema(endpoint.input)
  const output = new Schema(endpoint.output)
  const error = new Schema(io.error.schema)

  const channels = new io.Factory({ input, output, error })
  const query = new Query(1)// entity.schema.properties)

  return new Call(channels, query)
}

exports.call = call
