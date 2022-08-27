'use strict'

const { resolve } = require('./resolve')

const tenants = (manifest) => {
  if (manifest.extensions === undefined) return

  const connectors = []

  for (const [name, declaration] of Object.entries(manifest.extensions)) {
    const instance = tenant(name, declaration, manifest)

    if (instance !== undefined) connectors.push(instance)
  }

  return connectors
}

const tenant = (name, declaration, manifest) => {
  const factory = resolve(name, manifest.path)

  if (factory.tenant !== undefined) return factory.tenant(manifest.locator, declaration)
}

exports.tenants = tenants
