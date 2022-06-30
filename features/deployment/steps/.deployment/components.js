'use strict'

const { resolve, join } = require('node:path')
const { directory } = require('@toa.io/libraries/generic')

/**
 * @param {string[]} list
 * @param {string} to
 * @returns {Promise<void>}
 */
const copy = async (list, to) => {
  for (const component of list) {
    const source = join(COMPONENTS, component)
    const target = join(to, 'context/components', component)

    await directory.is(source)

    await directory.ensure(target)
    await directory.copy(source, target)
  }
}

const COMPONENTS = resolve(__dirname, './.components')

exports.copy = copy
