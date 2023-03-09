'use strict'

/**
 * @param {string} input
 * @returns {number}
 */
const quantity = (input) => {
  const match = input.match(EXPRESSION)

  if (match === null) throw new Error(`'${input}' doesn't look like a quantity of something`)

  const number = +match[1]
  const suffix = match[2]

  if (suffix.length === 0) return number

  const multiplier = find(suffix)

  if (multiplier === undefined) throw new Error(`'${suffix}' doesn't look like a quantity unit`)

  return number * multiplier
}

/**
 * @param {string} suffix
 * @returns {number}
 */
const find = (suffix) => {
  const pair = MULTIPLIERS.find(([unit]) => suffix.substring(0, unit.length) === unit)

  return pair?.[1]
}

/**
 * Order matters.
 *
 * @type {[string, number][]}
 */
const MULTIPLIERS = Object.entries({
  k: 1000,
  Ki: 1024,
  K: 1024,
  Mi: Math.pow(1024, 2),
  M: Math.pow(1000, 2),
  Gi: Math.pow(1024, 3),
  G: Math.pow(1000, 3),
  Ti: Math.pow(1024, 4),
  T: Math.pow(1000, 4)
})

const EXPRESSION = /^(\d+(?:.\d+)?)([^\d\W]*)$/

exports.quantity = quantity
