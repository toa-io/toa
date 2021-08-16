'use strict'

const { concat, console } = require('@kookaburra/gears')
const { scan } = require('./scan')

class Package {
  locator
  entity
  operations

  static async load (dir, options) {
    const manifest = await scan(dir, options)

    const instance = new Package()

    instance.locator = { name: manifest.name, domain: manifest.domain }
    instance.entity = manifest.entity
    instance.operations = manifest.operations

    console.debug(`Package '${concat(instance.locator.domain, '.')}` + `${instance.locator.forename}' loaded`)

    return instance
  }
}

exports.Package = Package
