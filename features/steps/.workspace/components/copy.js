'use strict'

const { join } = require('node:path')
const { directory } = require('@toa.io/filesystem')

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

    const dir = await directory.is(source)

    if (!dir) throw Error('Source directory does not exists')

    await directory.ensure(target)
    await directory.copy(source, target)
  }
}

exports.copy = copy
