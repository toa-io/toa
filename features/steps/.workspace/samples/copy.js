'use strict'

const { join } = require('node:path')
const { directory } = require('@toa.io/filesystem')

const SAMPLES = join(__dirname, 'collection')

/**
 * @param {string} to
 */
const copy = async (to) => {
  const target = join(to, 'samples')

  await directory.ensure(target)
  await directory.copy(SAMPLES, target)
}

exports.copy = copy
