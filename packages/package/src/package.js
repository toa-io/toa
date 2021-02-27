'use strict'

const { console } = require('@kookaburra/gears')
const { load } = require('./load')

class Package {
  locator
  state
  operations

  static async load (dir, options) {
    const { manifest, algorithms } = await load(dir, options)

    const instance = new Package()

    instance.locator = { forename: manifest.name, domain: manifest.domain }
    instance.state = manifest.state
    instance.operations = algorithms.reduce(reduce, manifest.operations || {})

    console.debug(`Package '${(instance.locator.domain ? `${instance.locator.domain}.` : '')}${instance.locator.forename}' loaded`)

    return instance
  }
}

function reduce (operations, algorithm) {
  const operation = operations[algorithm.name] || (operations[algorithm.name] = {})

  Object.assign(operation, algorithm)

  return operations
}

exports.Package = Package
