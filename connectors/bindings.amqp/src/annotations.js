'use strict'

const { validate } = require('./.annotations')

/**
 * @param {string} declaration
 * @returns {string}
 */
const annotations = (declaration) => {
  validate(declaration)

  return declaration
}

exports.annotations = annotations
