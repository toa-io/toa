'use strict'

const get = require('./.deployment')

/** @type {toa.pointer.Deployment} */
const deployment = (instances, uris, options) => {
  if (typeof uris === 'string') uris = { default: uris }

  get.validate(uris)

  const global = get.variables(uris, options.prefix)
  const variables = { global }

  return { variables }
}

exports.deployment = deployment
