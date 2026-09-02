import { resolve } from './resolve.js'

/**
 * @param {toa.norm.Component} manifest
 */
const load = async (manifest) => {
  if (manifest.extensions === undefined)
    return

  await Promise.all(Object.keys(manifest.extensions)
    .map(async (name) => await resolve(name, manifest.path)))
}

export { load }
