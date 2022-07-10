'use strict'

const { resolve } = require('./uris')

const declare = require('./.deployment')

/** @type {toa.connectors.Deployment} */
const deployment = (instances, uris, prefix) => {
  /** @type {toa.deployment.dependency.Proxy[]} */
  const proxies = []

  /** @type {toa.deployment.dependency.Variables} */
  const variables = {}

  for (const instance of instances) {
    const url = resolve(uris, instance.locator)
    const proxy = declare.proxy(instance, url, prefix)

    proxies.push(proxy)
    variables[instance.locator.label] = declare.variables(instance, url, prefix)
  }

  return { proxies, variables }
}

exports.deployment = deployment
