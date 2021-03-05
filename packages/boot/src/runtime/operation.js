'use strict'

const { Operation } = require('@kookaburra/runtime')

const operation = ({ algorithm, target }) => {
  const operation = new Operation(algorithm, target)

  return { algorithm, operation }
}

exports.operation = operation
