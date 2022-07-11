'use strict'

const { Locator } = require('@toa.io/core')

const { resolve } = require('./uris')
const declare = require('./.deployment')

/** @type {toa.connectors.Deployment} */
const deployment = (prefix, instances, uris, extensions = undefined) => {
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

  if (extensions !== undefined) {
    const { proxies: extended, variables: system } = extend(extensions, uris, prefix)

    proxies.push(...extended)
    variables.system = system.system
  }

  return { proxies, variables }
}

/**
 * @param {string[]} extensions
 * @param {toa.connectors.URIs} uris
 * @param {string} prefix
 * @returns {toa.deployment.dependency.Declaration}
 */
const extend = (extensions, uris, prefix) => {
  const proxies = []
  const variables = { system: [] }

  for (const extension of extensions) {
    const locator = new Locator(extension)
    const instance = { locator }
    const url = resolve(uris, locator)
    const proxy = declare.proxy(instance, url, prefix)
    const system = declare.variables(instance, url, prefix)

    proxies.push(proxy)
    variables.system.push(...system)
  }

  return { proxies, variables }
}

exports.deployment = deployment
