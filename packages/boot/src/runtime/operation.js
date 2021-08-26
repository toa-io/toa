'use strict'

const { Operation } = require('@kookaburra/runtime')

const operation = ({ bridge, target, ...rest }) => {
  const operation = new Operation(bridge, target)

  return { operation, ...rest }
}

exports.operation = operation
