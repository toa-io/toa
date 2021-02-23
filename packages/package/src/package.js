'use strict'

const { load } = require('./load')

class Package {
  manifest
  operations

  static async load (dir, options) {
    const { manifest, operations } = await load(dir, options)

    return Object.assign(new Package(), { manifest, operations })
  }
}

exports.Package = Package
