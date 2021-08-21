'use strict'

const { io, Invocation, Query } = require('@kookaburra/runtime')

const invocation = ({ algorithm, operation, schemas, entity }) => {
  const input = schemas.add(algorithm.input)
  const output = schemas.add(algorithm.output)
  const error = schemas.get(io.error.schema.$id)

  const channels = new io.Factory({ input, output, error })
  const query = new Query(algorithm.query, entity?.schema?.properties)
  const invocation = new Invocation(operation, channels, query)

  return [algorithm.name, invocation]
}

exports.invocation = invocation
