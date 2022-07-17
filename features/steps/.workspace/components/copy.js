'use strict'

const { join } = require('node:path')
const { directory } = require('@toa.io/libraries/filesystem')

const { COLLECTION } = require('./constants')

/**
 * @param {string[]} list
 * @param {string} to
 * @returns {Promise<void>}
 */
const copy = async (list, to) => {
  for (const component of list) {
    const source = join(COLLECTION, component)
    const target = join(to, 'components', component)

    await directory.is(source)

    await directory.ensure(target)
    await directory.copy(source, target)
  }
}

exports.copy = copy
