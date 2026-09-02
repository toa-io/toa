import { resolve } from './resolve.js'

/**
 * @param {toa.norm.Component} manifest
 */
const load = (manifest) => {
  if (manifest.extensions === undefined)
    return

  for (const name of Object.keys(manifest.extensions))
    resolve(name, manifest.path)
}

export { load }
