'use strict'

const { resolve } = require('./resolve')

/**
 * @param {toa.norm.Component} manifest
 */
const load = (manifest) => {
  if (manifest.extensions === undefined) return

  for (const name of Object.keys(manifest.extensions)) resolve(name, manifest.path)
}

exports.load = load
