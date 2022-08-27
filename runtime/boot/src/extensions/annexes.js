'use strict'

const { resolve } = require('./resolve')

const annexes = (manifest) => {
  if (manifest.extensions === undefined) return

  const annexes = []

  for (const [name, declaration] of Object.entries(manifest.extensions)) {
    const annex = instantiate(name, declaration, manifest)

    if (annex !== undefined) annexes.push(annex)
  }

  return annexes
}

/**
 * @param {string} path
 * @param {any} declaration
 * @param {toa.norm.Context} manifest
 * @returns {toa.core.extensions.Annex}
 */
const instantiate = (path, declaration, manifest) => {
  const factory = resolve(path, '.')

  if (factory.annex !== undefined) return factory.annex(manifest.locator, declaration)
}

exports.annexes = annexes
