'use strict'

/**
 * @param {any[]} array
 * @returns {ary[][]}
 */
const transpose = (array) => {
  if (!Array.isArray(array[0])) array = [array]

  return array[0].map((_, col) => array.map(row => row[col]))
}

exports.transpose = transpose
