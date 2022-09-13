'use strict'

const specials = require('./.prepare')

/**
 * @param {toa.samples.Declaration} declaration
 */
const prepare = (declaration) => {
  for (const [keyword, prepare] of Object.entries(specials)) {
    if (keyword in declaration) prepare(declaration)
  }
}

exports.prepare = prepare
