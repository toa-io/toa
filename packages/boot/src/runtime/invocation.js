'use strict'

const { schemes: { Schema }, Invocation } = require('@kookaburra/runtime')

const invocation = ({ algorithm, operation }) => {
  const schema = algorithm.input?.schema ? new Schema(algorithm.input?.schema) : undefined
  const invocation = new Invocation(operation, schema)

  return [algorithm.name, invocation]
}

exports.invocation = invocation
