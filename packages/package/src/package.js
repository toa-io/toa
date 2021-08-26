'use strict'

const { manifest } = require('./manifest')

class Package {
  static async load (dir, options) {
    return manifest(dir, options)
  }
}

exports.Package = Package
