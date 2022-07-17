'use strict'

const declare = require('./.deployment')

/** @type {toa.pointer.Deployment} */
const deployment = (instances, uris, options) => {
  if (typeof uris === 'string') uris = { default: uris }

  const proxies = declare.proxies(instances, uris, options)
  const global = declare.variables(uris, options.prefix)
  const variables = { global }

  return { proxies, variables }
}

exports.deployment = deployment
