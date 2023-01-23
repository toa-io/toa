'use strict'

/**
 * @param {toa.samples.Operation & Object} declaration
 */
const configuration = (declaration) => {
  const configuration = declaration.configuration

  delete declaration.configuration

  if (declaration.extensions === undefined) declaration.extensions = {}

  if ('configuration' in declaration.extensions) {
    throw new Error('Configuration extension sample is ambiguous')
  }

  /** @type {toa.sampling.request.extensions.Call} */
  const call = {
    result: configuration,
    permanent: true
  }

  declaration.extensions.configuration = [call]
}

exports.configuration = configuration
