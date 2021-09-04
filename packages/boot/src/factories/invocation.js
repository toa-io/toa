'use strict'

const { io, Invocation, Query, Schema } = require('@kookaburra/runtime')

const invocation = (manifest, entity, call) => {
  const input = new Schema(manifest.input)
  const output = new Schema(manifest.output)
  const error = new Schema(io.error.schema)

  const channels = new io.Factory({ input, output, error })
  const query = new Query(entity.schema.properties)

  return new Invocation(call, channels, query)
}

exports.invocation = invocation
