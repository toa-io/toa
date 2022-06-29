'use strict'

const { resolve } = require('./resolve')

const connectors = (manifest) => {
  if (manifest.extensions === undefined) return

  const connectors = []

  for (const [name, declaration] of Object.entries(manifest.extensions)) {
    const instance = connector(name, declaration, manifest)

    if (instance !== undefined) connectors.push(instance)
  }

  return connectors
}

const connector = (name, declaration, manifest) => {
  const factory = resolve(name, manifest.path)

  if (factory.connector !== undefined) return factory.connector(manifest.locator, declaration)
}

exports.connectors = connectors
