'use strict'

const { console } = require('@kookaburra/gears')
const { traverse } = require('./traversal')

class Package {
  locator
  state
  operations

  static async load (dir, options) {
    const manifest = await traverse(dir, options)

    const instance = new Package()

    instance.locator = { forename: manifest.name, domain: manifest.domain }
    instance.state = manifest.state
    instance.operations = manifest.operations

    console.debug(`Package '${(instance.locator.domain ? `${instance.locator.domain}.` : '')}` +
      `${instance.locator.forename}' loaded`)

    return instance
  }
}

exports.Package = Package
