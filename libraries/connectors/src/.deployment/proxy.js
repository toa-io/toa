'use strict'

/**
 * @param {toa.norm.context.dependencies.Instance} instance
 * @param {URL} url
 * @param {string} prefix
 * @returns {toa.deployment.dependency.Proxy}
 */
const proxy = (instance, url, prefix) => {
  const target = url.hostname
  const name = instance.locator.hostname(prefix)

  return { target, name }
}

exports.proxy = proxy
