import { resolve } from './resolve.js'

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

    if (Array.isArray(aspect)) aspects.push(...aspect)
    else aspects.push(aspect)
  }

  return aspects
}

export { aspects }
