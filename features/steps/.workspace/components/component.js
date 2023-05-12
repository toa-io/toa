'use strict'

const { join } = require('node:path')
const stage = require('@toa.io/userland/stage')

const { COLLECTION } = require('./constants')

/**
 * @param {string} reference
 * @returns {Promise<toa.core.Component>}
 **/
const component = async (reference) => {
  const path = join(COLLECTION, reference)

  return stage.component(path)
}

exports.component = component
