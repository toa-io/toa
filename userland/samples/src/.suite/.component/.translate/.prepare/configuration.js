'use strict'

/**
 * @param {toa.samples.operations.Declaration} declaration
 */
const configuration = (declaration) => {
  const configuration = declaration.configuration

  delete declaration.configuration

  if (declaration.extensions === undefined) declaration.extensions = {}
  if (declaration.extensions.configuration !== undefined) throw new Error('Configuration extension sample is ambiguous')

  declaration.extensions.configuration = [{
    result: configuration,
    permanent: true
  }]
}

exports.configuration = configuration
