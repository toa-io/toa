'use strict'

const { Locator } = require('@toa.io/core')
const { resolve } = require('../uris')
const { proxy: declare } = require('./proxy')

/**
 * @param {toa.norm.context.dependencies.Instance[]} instances
 * @param {toa.pointer.URIs} uris
 * @param {toa.pointer.deployment.Options} options
 * @returns {toa.deployment.dependency.Proxy[]}
 */
const proxies = (instances, uris, options) => {
  const proxies = []

  for (const instance of instances) {
    const { url } = resolve(instance.locator, uris)
    const proxy = declare(options.prefix, instance, url)

    proxies.push(proxy)
  }

  extend(proxies, uris, options)

  return proxies
}

/**
 * @param {toa.deployment.dependency.Proxy[]} proxies
 * @param {toa.pointer.URIs} uris
 * @param {toa.pointer.deployment.Options} options
 */
const extend = (proxies, uris, options) => {
  const { prefix, extensions } = options

  if (extensions === undefined) return

  for (const extension of extensions) {
    const locator = new Locator(extension)
    const instance = { locator }
    const { url } = resolve(locator, uris)
    const proxy = declare(prefix, instance, url)

    proxies.push(proxy)
  }

  return proxies
}

exports.proxies = proxies
