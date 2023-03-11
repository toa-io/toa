'use strict'

const read = require('./.read')

/**
 * @param {string} path
 * @returns {Promise<toa.samples.Suite>}
 */
const context = async (path) => {
  /** @type {toa.samples.Suite} */
  const suite = { title: 'Integration samples', autonomous: false }

  suite.operations = await read.operations(path)
  suite.messages = await read.messages(path)

  return suite
}

exports.context = context
