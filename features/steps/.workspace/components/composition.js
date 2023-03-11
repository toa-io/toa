'use strict'

const boot = require('@toa.io/boot')
const { resolve } = require('./load')

/**
 * @param {string[]} references
 * @param {string[]} [bindings]
 * @returns {Promise<toa.core.Connector>}
 **/
const composition = async (references, bindings) => {
  const paths = /** @type {string[]} */ references.map(resolve)
  const options = { bindings }
  const composition = /** @type {toa.core.Connector} */ await boot.composition(paths, options)

  await composition.connect()

  return composition
}

exports.composition = composition
