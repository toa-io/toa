'use strict'

/**
 * @param {any} reference
 * @param {any} candidate
 * @returns {boolean}
 */
const match = (reference, candidate) => {
  if (typeof candidate !== typeof reference) return false

  if (Array.isArray(candidate)) {
    if (!Array.isArray(reference)) return false

    return candidate.reduce((cur, value) => (cur && reference.some((item) => match(item, value))), true)
  }

  if (typeof candidate === 'object') {
    if (candidate === null) return reference === null
    else if (reference === null) return false

    for (const [key, value] of Object.entries(candidate)) {
      if (match(reference[key], value) === false) return false
    }

    return true
  }

  return reference === candidate
}

exports.match = match
