'use strict'

const boot = require('@toa.io/boot')
const { load } = require('./load')

/**
 * @param {string} reference
 * @returns {Promise<toa.core.Runtime>}
 **/
const runtime = async (reference) => {
  const manifest = await load(reference)
  const component = /** @type {toa.core.Runtime} */ await boot.runtime(manifest)

  await component.connect()

  return component
}

exports.runtime = runtime
