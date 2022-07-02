'use strict'

const { join } = require('node:path')
const { directory } = require('@toa.io/libraries/filesystem')

/**
 * @param {string} component
 * @param {string} destination
 * @returns Promise<void>
 */
const copy = async (component, destination) => {
  const source = join(__dirname, component)
  const target = join(destination, component)

  await directory.copy(source, target)
}

exports.copy = copy
