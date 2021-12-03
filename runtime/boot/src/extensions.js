'use strict'

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
    factories[name] = new (require(name).Factory)()
  }

  return factories[name].connector(manifest.locator, definition)
}

const factories = {}

exports.extensions = extensions
