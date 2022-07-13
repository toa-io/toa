'use strict'

/**
 * @param {string} prefix
 * @param {toa.norm.context.dependencies.Instance} instance
 * @param {URL} url
 * @returns {toa.deployment.dependency.Proxy}
 */
const proxy = (prefix, instance, url) => {
  const target = url.hostname
  const name = instance.locator.hostname(prefix)

  return { target, name }
}

exports.proxy = proxy
