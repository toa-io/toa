'use strict'

/**
 * @param {string} input
 * @returns {string}
 */
const echo = (input) => {
  return input.replaceAll(RX, (_, variable) => process.env[variable] ?? '')
}

const RX = /\${([A-Z_]*[A-Z]+)}/g

exports.echo = echo
