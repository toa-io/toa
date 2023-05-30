'use strict'

const clone = require('clone-deep')

/**
 * @param {object} source
 */
function clear (source) {
  const object = clone(source)

  return next(object)
}

function next (source) {
  if (typeof source !== 'object') return source
  if (source === null) return source

  for (const [key, entity] of Object.entries(source)) {
    if (entity === null) delete source[key]
    if (entity === undefined) delete source[key]
    if (typeof entity === 'object' && entity !== null) next(entity)
  }
  return source
}

exports.clear = clear
