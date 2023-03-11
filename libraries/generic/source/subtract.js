'use strict'

/** @type {toa.generic.Subtract} */
const subtract = (left, right) => {
  const filter = (item) => Array.isArray(right) ? !right.includes(item) : !right.has(item)

  if (Array.isArray(left)) return left.filter(filter)
  else return new Set([...left].filter(filter))
}

exports.subtract = subtract
