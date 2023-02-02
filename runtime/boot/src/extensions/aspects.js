'use strict'

const { resolve } = require('./resolve')

/**
 * @param {toa.norm.Component} manifest
 * @returns {toa.core.extensions.Aspect[]}
 */
const aspects = (manifest) => {
  const aspects = []

  if (manifest.extensions === undefined) return aspects

  for (const [name, declaration] of Object.entries(manifest.extensions)) {
    const factory = resolve(name, manifest.path)

    if (factory.aspect === undefined) continue

    const aspect = factory.aspect(manifest.locator, declaration)

    aspects.push(aspect)
  }

  return aspects
}

exports.aspects = aspects
