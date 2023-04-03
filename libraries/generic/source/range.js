'use strict'

/** @type {toa.generic.range} */
const range = (input) => {
  const list = input.split(',')
  const arrays = list.map(parse)

  return arrays.flat()
}

function parse (input) {
  input = input.trim()

  const match = input.match(RANGE)

  if (match === null) throw new Error('Invalid input format')

  const min = Number(match.groups.min)
  const max = match.groups.max === undefined ? min : Number(match.groups.max)
  const result = []

  for (let i = min; i <= max; i++) result.push(i)

  return result
}

const RANGE = /^(?<min>\d+)(?:(?:-|..)(?<max>\d+))?$/

exports.range = range
