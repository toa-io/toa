'use strict'

const boot = require('@toa.io/boot')
const { resolve } = require('./load')

/**
 * @param {string} reference
 * @returns {Promise<toa.core.Connector>}
 **/
const composition = async (reference) => {
  const path = resolve(reference)
  const composition =
    /** @type {toa.core.Connector} */ await boot.composition([path])

  await composition.connect()

  return composition
}

exports.composition = composition
