'use strict'

const { directory: { find } } = require('@toa.io/libraries/generic')
const boot = require('../..')

/**
 * @param {string} reference
 * @param {string} base
 * @returns {toa.core.extensions.Factory}
 */
const resolve = (reference, base) => {
  const path = find(reference, base)
  const { Factory } = require(path)

  return new Factory(boot)
}

exports.resolve = resolve
