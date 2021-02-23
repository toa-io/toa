'use strict'

const { load } = require('./load')

class Package {
  manifest
  operations

  static async load (dir, options) {
    const { manifest, algorithms } = await load(dir, options)

    return Object.assign(new Package(), { manifest, algorithms })
  }
}

exports.Package = Package
