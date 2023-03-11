'use strict'

/**
 * @returns {toa.extensions.origins.Declaration}
 */
const normalize = (declaration) => {
  declaration = origins(declaration)

  return declaration
}

const origins = (declaration) => {
  if (declaration.origins !== undefined) return declaration
  else return { origins: { ...declaration } }
}

exports.normalize = normalize
