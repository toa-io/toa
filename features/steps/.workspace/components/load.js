'use strict'

const { join } = require('node:path')
const stage = require('@toa.io/userland/stage')

const { COLLECTION } = require('./constants')

/**
 * @param {string} reference
 * @returns {toa.norm.Component}
 */
const load = async (reference) => {
  const path = join(COLLECTION, reference)

  return stage.manifest(path)
}

exports.load = load
