'use strict'

const load = require('./load')

module.exports = class Package {
  static async load (dir, options) {
    const { manifest, operations } = await load(dir, options)

    const component = new Package()

    component.manifest = manifest
    component.operations = operations

    return component
  }

  manifest
  operations
}
