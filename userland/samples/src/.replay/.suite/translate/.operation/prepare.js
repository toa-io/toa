'use strict'

const { cast, expand } = require('./.prepare')

/**
 * @param {toa.samples.Operation & Object} declaration
 */
const prepare = (declaration) => {
  expand(declaration)

  if ('extensions' in declaration) cast(declaration.extensions)
}

exports.prepare = prepare
