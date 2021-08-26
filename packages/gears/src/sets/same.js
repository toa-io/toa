'use strict'

const same = (a, b) => {
  a = new Set(a)
  b = new Set(b)

  if (a.size !== b.size) return false

  for (const value of a) if (!b.has(value)) return false

  return true
}

exports.same = same
