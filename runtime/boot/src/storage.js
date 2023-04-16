'use strict'

const { join } = require('node:path')
const extensions = require('./extensions')

/**
 * @param {toa.norm.Component} component
 * @returns {toa.core.Storage}
 */
const storage = (component) => {
  const [Factory, properties] = load(component)

  /** @type {toa.core.storages.Factory} */
  const factory = new Factory()
  const storage = factory.storage(component.locator, properties)

  return extensions.storage(storage)
}

function load (component) {
  const reference = component.entity.storage
  const path = require.resolve(reference, { paths: [component.path, __dirname] })
  const { Factory } = require(path)

  const pkg = loadPackageJson(component.path, reference)
  const properties = pkg === null ? null : component.properties?.[pkg.name]

  return [Factory, properties]
}

function loadPackageJson (root, reference) {
  const packageJson = join(reference, 'package.json')

  try {
    const path = require.resolve(packageJson, { paths: [root, __dirname] })

    return require(path)
  } catch (e) {
    return null
  }
}

exports.storage = storage
