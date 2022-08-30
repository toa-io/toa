'use strict'

const { resolve } = require('./resolve')

/**
 * @param {toa.norm.Component[]} manifests
 * @param {string[]} defaults
 */
const load = (manifests, defaults) => {
  scan(manifests)
  defaults.map((name) => resolve(name))
}

/**
 * @param {toa.norm.Component[]} manifests
 */
const scan = (manifests) => {
  for (const manifest of manifests) {
    if (manifest.extensions === undefined) continue

    for (const name of Object.keys(manifest.extensions)) {
      resolve(name, manifest.path)
    }
  }
}

exports.load = load
