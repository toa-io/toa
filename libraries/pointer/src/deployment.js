'use strict'

const declare = require('./.deployment')

/** @type {toa.pointer.Deployment} */
const deployment = (prefix, instances, uris, extensions = undefined) => {
  const proxies = declare.proxies(prefix, instances, uris, extensions)
  const global = declare.variables(prefix, uris)
  const variables = { global }

  return { proxies, variables }
}

exports.deployment = deployment
