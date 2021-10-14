'use strict'

const { lookup } = require('@kookaburra/gears')

const extensions = (manifest) => {
  if (manifest.extensions === undefined) return

  const extensions = []

  for (const [key, value] of Object.entries(manifest.extensions)) {
    extensions.push(extension(key, value, manifest))
  }

  return extensions
}

const extension = (name, definition, manifest) => {
  if (factories[name] === undefined) {
    const module = lookup(name, manifest.path)

    factories[name] = new (require(module).Factory)()
  }

  return factories[name].connector(manifest.locator, definition)
}

const factories = {}

exports.extensions = extensions
