'use strict'

const { Locator } = require('@toa.io/core')
const { uris: { resolve } } = require('@toa.io/libraries/connectors')

const { SYSTEM, PREFIX } = require('../../constants')

/**
 * @param {toa.connectors.URIs} annotation
 * @returns {toa.deployment.dependency.Proxy}
 */
const proxy = (annotation) => {
  const locator = new Locator(SYSTEM)
  const name = locator.hostname(PREFIX)
  const url = resolve(annotation, locator)
  const target = url.hostname

  return { name, target }
}

exports.proxy = proxy
