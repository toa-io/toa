'use strict'

/**
 * @param {string} input
 * @param {Record<string, string>} [variables]
 * @returns {string}
 */
const echo = (input, variables = process.env) => {
  return input.replaceAll(RX, (_, variable) => variables[variable] ?? '')
}

const RX = /\${([A-Za-z_]{0,32})}/g

exports.echo = echo
