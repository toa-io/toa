'use strict'

const { validate } = require('./.annotation')

/**
 * @param {string} declaration
 * @returns {string}
 */
const annotation = (declaration) => {
  validate(declaration)

  return declaration
}

exports.annotation = annotation
