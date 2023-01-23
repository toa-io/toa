'use strict'

const specials = require('./.prepare')

/**
 * @param {toa.samples.Operation & Object} declaration
 */
const prepare = (declaration) => {
  for (const [keyword, prepare] of Object.entries(specials)) {
    if (keyword in declaration) prepare(declaration)
  }
}

exports.prepare = prepare
