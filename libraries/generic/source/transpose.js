'use strict'

/** @type {toa.generic.Transpose} */
const transpose = (array) => {
  if (!Array.isArray(array[0])) array = [array]

  return array[0].map((_, col) => array.map(row => row[col]))
}

exports.transpose = transpose
