'use strict'

const { defaults } = require('@toa.io/generic')
const norm = require('@toa.io/norm')
const { merge } = require('@toa.io/generic')

const read = require('./.read')

/**
 * @param {string[]} paths
 * @param {toa.samples.suite.Options} [options]
 * @returns {Promise<toa.samples.Suite>}
 */
const components = async (paths, options = {}) => {
  /** @type {toa.samples.Suite} */
  const suite = { title: 'Component samples', autonomous: true, operations: {} }

  for (const path of paths) {
    const manifest = await norm.component(path)

    options.id = manifest.locator.id

    const operations = await read.operations(path, options)
    const locator = `${manifest.namespace}.${manifest.name}`

    for (const [key, value] of Object.entries(manifest.operations)) {
      const manifestOperations = operations[locator]

      if (manifestOperations === undefined) {
        continue
      }

      const operation = manifestOperations[key]

      if (operation === undefined) {
        continue
      }

      operation.forEach(item => {
        const defaultValue = defaults(value.input)
        if (defaultValue !== null && item.input !== undefined) {
          item.input = Object.assign(defaultValue, item.input)
        }
      })
    }

    // const messages = await read.messages(path, options)

    merge(suite, { operations })
  }

  return suite
}

exports.components = components
