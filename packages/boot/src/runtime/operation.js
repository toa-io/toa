const { Operation } = require('@kookaburra/runtime')

const operation = ([, algorithm]) => {
  const operation = new Operation(algorithm)

  return [algorithm, operation]
}

exports.operation = operation
