'use strict'

const { plain } = require('./plain')

/**
 * @param {object} input
 * @param {(key: string, value: any) => [key: string, value: any]} transform
 */
function map (input, transform) {
  const result = {}

  for (const [key, value] of Object.entries(input)) {
    const output = transform(key, value)

    if (output !== undefined) result[output[0]] = output[1]
    else if (plain(value)) result[key] = map(value, transform)
    else result[key] = value
  }

  return result
}

exports.map = map
