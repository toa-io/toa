'use strict'

const read = require('./.read')

/**
 * @param {string} path
 * @param {toa.samples.suite.Options} [options]
 * @returns {Promise<toa.samples.Suite>}
 */
const context = async (path, options = {}) => {
  /** @type {toa.samples.Suite} */
  const suite = { title: 'Integration samples', autonomous: false }

  suite.operations = await read.operations(path, options)
  suite.messages = await read.messages(path, options)

  return suite
}

exports.context = context
