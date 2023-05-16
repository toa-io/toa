'use strict'

const { plain } = require('./plain')

/**
 * @param {object} input
 * @param {toa.generic.map.transform} transform
 */
function map (input, transform) {
  const result = {}

  for (const [key, value] of Object.entries(input)) {
    if (plain(value)) {
      result[key] = map(value, transform)

      continue
    }

    let k = key
    let v = value

    if (transform.length === 1) v = val(value, transform)
    else [k, v] = keyVal(key, value, transform)

    result[k] = v
  }

  return result
}

/**
 * @param {any} value
 * @param {toa.generic.map.v} transform
 * @returns {*}
 */
function val (value, transform) {
  const output = transform(value)

  return output === undefined ? value : output
}

/**
 * @param {string} key
 * @param {any} value
 * @param {toa.generic.map.kv} transform
 * @returns {*}
 */
function keyVal (key, value, transform) {
  const output = transform(key, value)

  return output !== undefined ? output : [key, value]
}

exports.map = map
