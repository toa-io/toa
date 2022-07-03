'use strict'

const camelcase = (string, length = 2) => {
  const parts = string.split(/(?=[A-Z])/).map((word) => shrink(word, length))

  return parts.join('')
}

/**
 * @param {string} word
 * @param {number} length
 * @returns {string}
 */
const shrink = (word, length) => {
  return word.substring(0, length)
}

exports.camelcase = camelcase
