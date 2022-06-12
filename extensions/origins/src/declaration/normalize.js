'use strict'

/**
 * @returns {toa.extensions.origins.Declaration}
 */
const normalize = (declaration) => {
  origins(declaration)

  return declaration
}

const origins = (declaration) => {
  if (declaration.origins === undefined) {
    declaration.origins = { ...declaration }

    for (const key of Object.keys(declaration.origins)) delete declaration[key]
  }
}

exports.normalize = normalize
