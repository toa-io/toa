'use strict'

const { join } = require('node:path')
const fse = require('fs-extra')

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

    const dir = await fse.exists(source)

    if (!dir) throw Error('Source directory does not exists')

    await fse.ensureDir(target)
    await fse.copy(source, target)
  }
}

exports.copy = copy
