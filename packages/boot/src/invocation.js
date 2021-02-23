const { Invocation } = require('@kookaburra/runtime')

const invocation = (operation) => {
  return new Invocation(operation)
}

exports.invocation = invocation
