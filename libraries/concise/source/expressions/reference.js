'use strict'

/**
 * @param {string} value
 * @returns {object}
 */
function reference (value) {
  if (typeof value !== 'string') return null

  const match = value.match(RX)

  if (match === null) return null

  const [file, ref] = match.groups.ref.split('#')
  const parts = [file]

  if (ref !== undefined) {
    const propertyRef = ref.replaceAll(/\/(?!$)/g, '/properties/')

    parts.push(propertyRef)
  }

  const $ref = parts.join('#')

  return { $ref }
}

const RX = /^ref:(?<ref>.+)/

exports.reference = reference
