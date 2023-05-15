'use strict'

const shortcuts = require('./shortcuts')

/**
 * @param {toa.samples.Operation & Object} declaration
 */
function expand (declaration) {
  for (const [shortcut, expand] of Object.entries(shortcuts)) {
    if (shortcut in declaration) expand(declaration)
  }
}

exports.expand = expand
