'use strict'

/**
 * @param {any} reference
 * @param {any} candidate
 * @returns {boolean}
 */
const match = (reference, candidate) => {
  if (typeof candidate !== typeof reference) return false

  if (Array.isArray(candidate)) return arrays(reference, candidate)
  if (typeof candidate === 'object') return objects(candidate, reference)

  return reference === candidate
}

/**
 * @param {any} reference
 * @param {any[]} candidate
 * @return {boolean}
 */
function arrays (reference, candidate) {
  if (!Array.isArray(reference)) return false

  return candidate.reduce((result, value) => (result && reference.some((item) => match(item, value))), true)
}

/**
 * @param {Object} candidate
 * @param {Object} reference
 * @return {boolean}
 */
function objects (candidate, reference) {
  if (candidate === null) return reference === null
  else if (reference === null) return false

  for (const [key, value] of Object.entries(candidate)) {
    if (match(reference[key], value) === false) return false
  }

  return true
}

exports.match = match
