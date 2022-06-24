'use strict'

const { resolve } = require('./resolve')

const contexts = (manifest) => {
  if (manifest.extensions === undefined) return

  const contexts = []

  for (const [name, declaration] of Object.entries(manifest.extensions)) {
    const extension = instantiate(name, declaration, manifest)

    if (extension !== undefined) contexts.push(extension)
  }

  return contexts
}

const instantiate = (path, declaration) => {
  const factory = resolve(path)

  if (factory.context !== undefined) return factory.context(declaration)
}

exports.contexts = contexts
