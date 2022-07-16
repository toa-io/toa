'use strict'

const { resolve } = require('node:path')
const boot = require('@toa.io/boot')

const { COLLECTION } = require('./constants')

/**
 * @param {string} reference
 * @returns {toa.norm.Component}
 */
const load = async (reference) => {
  const path = resolve(COLLECTION, reference)

  return await boot.component(path)
}

exports.load = load
