'use strict'

const { io, Invocation, Query } = require('@kookaburra/runtime')

const invocation = (invocations, { manifest, operation, schemas, entity }) => {
  const input = schemas.add(manifest.input)
  const output = schemas.add(manifest.output)
  const error = schemas.get(io.error.schema.$id)

  const channels = new io.Factory({ input, output, error })
  const query = new Query(entity?.schema?.properties)

  invocations[manifest.name] = new Invocation(operation, channels, query)

  return invocations
}

exports.invocation = invocation
