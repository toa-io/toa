'use strict'

const boot = require('@toa.io/boot')
const { resolve } = require('./load')

/**
 * @param {string[]} references
 * @returns {Promise<toa.core.Connector>}
 **/
const composition = async (references) => {
  const paths = references.map(resolve)
  const composition =
    /** @type {toa.core.Connector} */ await boot.composition(paths)

  await composition.connect()

  return composition
}

exports.composition = composition
