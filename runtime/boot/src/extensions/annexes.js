'use strict'

const { resolve } = require('./resolve')

/**
 * @param {toa.norm.Component} manifest
 * @returns {toa.core.extensions.Annex[]}
 */
const annexes = (manifest) => {
  const annexes = []

  if (manifest.extensions === undefined) return annexes

  for (const [name, declaration] of Object.entries(manifest.extensions)) {
    const factory = resolve(name, manifest.path)

    if (factory.annex === undefined) continue

    const annex = factory.annex(manifest.locator, declaration)

    annexes.push(annex)
  }

  return annexes
}

exports.annexes = annexes
