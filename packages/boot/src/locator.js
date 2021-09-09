'use strict'

const { Locator } = require('@kookaburra/runtime')

const locator = (manifest) => {
  return new Locator(manifest.domain, manifest.name, endpoints(manifest.operations))
}

const endpoints = (operations) => {
  return operations.map(({ name, type, target }) => ({ name, type, target }))
}
exports.locator = locator
