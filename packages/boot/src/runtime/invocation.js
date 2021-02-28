'use strict'

const { Invocation, Schema } = require('@kookaburra/runtime')

const invocation = ([algorithm, operation]) => {
  const schema = algorithm.schema ? new Schema(algorithm.schema) : undefined
  const invocation = new Invocation(operation, schema)

  return [algorithm.name, invocation]
}

exports.invocation = invocation
