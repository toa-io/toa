const { Operation } = require('@kookaburra/runtime')

const operation = (algorithm) => {
  return new Operation(algorithm)
}

exports.operation = operation
