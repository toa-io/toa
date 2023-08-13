'use strict'

/**
 * @param {string} input
 * @return {string}
 */
function trim (input) {
  return input
    .trim()
    .split('\n')
    .map((line) => line.trim())
    .join('\n')
}

exports.trim = trim
