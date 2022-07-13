'use strict'

const { Locator } = require('@toa.io/core')
const { resolve } = require('../uris')
const { proxy: declare } = require('./proxy')

/**
 * @param {string} prefix
 * @param {toa.norm.context.dependencies.Instance[]} instances
 * @param {toa.connectors.URIs} uris
 * @param {string[]} extensions
 * @returns {toa.deployment.dependency.Proxy[]}
 */
const proxies = (prefix, instances, uris, extensions) => {
  const proxies = []

  for (const instance of instances) {
    const url = resolve(instance.locator, uris)
    const proxy = declare(prefix, instance, url)

    proxies.push(proxy)
  }

  if (extensions !== undefined) extend(proxies, extensions, uris, prefix)

  return proxies
}

/**
 * @param {toa.deployment.dependency.Proxy[]} proxies
 * @param {string[]} extensions
 * @param {toa.connectors.URIs} uris
 * @param {string} prefix
 */
const extend = (proxies, extensions, uris, prefix) => {
  for (const extension of extensions) {
    const locator = new Locator(extension)
    const instance = { locator }
    const url = resolve(locator, uris)
    const proxy = declare(prefix, instance, url)

    proxies.push(proxy)
  }

  return proxies
}

exports.proxies = proxies
