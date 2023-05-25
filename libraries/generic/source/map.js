'use strict'

const { plain } = require('./plain')

/**
 * @param {object} input
 * @param {toa.generic.map.transform} transform
 */
function map (input, transform) {
  const result = {}

  for (const [key, value] of Object.entries(input)) {
    let output

    if (transform.length === 1) output = val(key, value, transform)
    else output = keyVal(key, value, transform)

    if (output !== undefined) result[output[0]] = output[1]
    else if (plain(value)) result[key] = map(value, transform)
    else result[key] = value
  }

  return result
}

/**
 * @template {T}
 * @param {string} key
 * @param {T} value
 * @param {toa.generic.map.v<T>} transform
 * @returns {*}
 */
function val (key, value, transform) {
  const output = transform(value)

  return output === undefined ? undefined : [key, output]
}

/**
 * @template {T}
 * @param {string} key
 * @param {T} value
 * @param {toa.generic.map.kv<T>} transform
 * @returns {*}
 */
function keyVal (key, value, transform) {
  const output = transform(key, value)

  return output === undefined ? undefined : output
}

exports.map = map
