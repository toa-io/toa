'use strict'

/**
 * @param {any} candidate
 * @return {boolean}
 */
function plain (candidate) {
  return candidate?.constructor.name === 'Object'
}

exports.plain = plain
