'use strict'

/** @type {toa.generic.Difference} */
const difference = (a, b) => {
  const diff = {}

  const keys = new Set([...Object.keys(a), ...Object.keys(b)])

  for (const key of keys) {
    if (typeof a[key] !== typeof b[key]) diff[key] = b[key]
    else if (typeof a[key] === 'object' && a[key] !== null) diff[key] = difference(a[key], b[key])
    else if (a[key] !== b[key]) diff[key] = b[key]
  }

  return diff
}

exports.difference = difference
