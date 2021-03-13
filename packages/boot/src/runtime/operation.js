'use strict'

const { Operation } = require('@kookaburra/runtime')

const operation = ({ algorithm, target, ...rest }) => {
  const operation = new Operation(algorithm, target)

  return { algorithm, operation, ...rest }
}

exports.operation = operation
