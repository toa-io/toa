'use strict'

const { parse } = require('./algorithm')
const load = require('../load')

const operation = async (root, name) => {
  try {
    const algorithm = load.operation(root, name)

    return parse(algorithm)
  } catch (e) {
    e.message = `Operation '${name}': ${e.message}`
    throw e
  }
}

exports.operation = operation
