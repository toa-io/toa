'use strict'

const { resolve } = require('./uris')

/** @type {toa.connectors.Deployment} */
const deployment = (instances, uris, prefix) => {
  const proxies = []

  for (const instance of instances) {
    const url = resolve(uris, instance.locator)
    const target = url.hostname
    const name = instance.locator.hostname(prefix)

    proxies.push({ name, target })
  }

  return { proxies }
}

exports.deployment = deployment
