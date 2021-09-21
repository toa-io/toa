'use strict'

const difference = (a, b) => {
  const diff = {}

  for (const key of Object.keys(a)) {
    if (typeof a[key] !== typeof b[key]) diff[key] = b[key]
    else if (typeof a[key] === 'object' && a[key] !== null) diff[key] = difference(a[key], b[key])
    else if (a[key] !== b[key]) diff[key] = b[key]
  }

  return diff
}

exports.difference = difference
