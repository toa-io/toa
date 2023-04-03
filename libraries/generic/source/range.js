'use strict'

/** @type {toa.generic.range} */
const range = (input) => {
  const list = input.split(',')
  const arrays = list.map(parse)

  return arrays.flat()
}

function parse (input) {
  input = input.trim()

  const [left, right] = input.split(SEPARATOR)

  const min = Number(left)
  const max = right === undefined ? min : Number(right)

  if (Number.isNaN(min)) throw new Error('Invalid input format')

  const result = []

  for (let i = min; i <= max; i++) result.push(i)

  return result
}

const SEPARATOR = /-|\.\./

exports.range = range
