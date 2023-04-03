'use strict'

const { range } = require('./range')

/**
 * @type {toa.generic.shards}
 */
const shards = (input) => {
  const match = input.match(RANGE)

  if (match === null) return [input]

  const numbers = range(match.groups.range)

  return numbers.map((number) => input.replace(RANGE, String(number)))
}

const RANGE = /{(?<range>[^{}]+)}/

exports.shards = shards
