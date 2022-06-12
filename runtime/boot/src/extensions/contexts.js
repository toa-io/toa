'use strict'

const { resolve } = require('./resolve')

const contexts = (manifest) => {
  if (manifest.extensions === undefined) return

  const contexts = []

  for (const [name, declaration] of Object.entries(manifest.extensions)) {
    const instances = instantiate(name, declaration, manifest)

    if (instances !== undefined) contexts.push(...instances)
  }

  return contexts
}

const instantiate = (path, declaration) => {
  const factory = resolve(path)

  if (factory.contexts !== undefined) return factory.contexts(declaration)
}

exports.contexts = contexts
