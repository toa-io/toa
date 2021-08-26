'use strict'

const { manifest } = require('./manifest')

class Package {
  static async load (root, options) {
    return manifest(root, options)
  }
}

exports.Package = Package
