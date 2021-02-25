const { Operation } = require('@kookaburra/runtime')

const operation = (algorithm) => {
  return { operation: new Operation(algorithm), manifest: algorithm.manifest }
}

exports.operation = operation
