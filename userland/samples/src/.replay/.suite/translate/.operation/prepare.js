'use strict'

const shortcuts = require('./shortcuts')

/**
 * @param {toa.samples.Operation & Object} declaration
 */
const prepare = (declaration) => {
  for (const [shortcut, prepare] of Object.entries(shortcuts)) {
    if (shortcut in declaration) prepare(declaration)
  }
}

exports.prepare = prepare
