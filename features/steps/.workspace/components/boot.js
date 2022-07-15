'use strict'

const { resolve } = require('node:path')
const core = require('@toa.io/boot')

const { COLLECTION } = require('./constants')

/**
 * @param {string} reference
 * @returns {Promise<toa.core.Runtime>}
 **/
const boot = async (reference) => {
  const path = resolve(COLLECTION, reference)
  const component = await core.component(path)

  return await core.runtime(component)
}

exports.boot = boot
