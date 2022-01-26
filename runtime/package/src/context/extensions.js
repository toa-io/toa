'use strict'

const { describe } = require('./describe')

const extensions = (context) => {
  const extensions = {}

  for (const component of context.components) {
    if (component.extensions !== undefined) {
      for (const extension of Object.keys(component.extensions)) {
        if (extensions[extension] === undefined) extensions[extension] = []

        extensions[extension].push(describe(component))
      }
    }
  }

  return extensions
}

exports.extensions = extensions
