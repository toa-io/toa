'use strict'

const extensions = (component) => {
  if (component.extensions === undefined) return

  for (const [key, value] of Object.entries(component.extensions)) {
    const extension = require(key)

    if (extension.manifest?.normalize) component.extensions[key] = extension.manifest.normalize(value, component)
  }
}

exports.extensions = extensions
