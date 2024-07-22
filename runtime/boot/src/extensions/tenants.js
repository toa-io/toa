'use strict'

const { resolve } = require('./resolve')

/**
 * @param {toa.norm.Component} manifest
 * @returns {toa.core.Connector[]}
 */
const tenants = (manifest) => {
  const tenants = []

  if (manifest.extensions === undefined) return tenants

  for (const [name, declaration] of Object.entries(manifest.extensions)) {
    const factory = resolve(name, manifest.path)

    if (factory.tenant === undefined) continue

    const tenant = factory.tenant(manifest.locator, declaration, manifest)

    tenants.push(tenant)
  }

  return tenants
}

exports.tenants = tenants
