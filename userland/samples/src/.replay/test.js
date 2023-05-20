'use strict'

const tap = require('tap')

const replay = require('./suite')

/**
 * @param {toa.samples.Suite} suite
 * @param {object} options
 * @return {Promise<boolean>}
 */
const test = async (suite, options) => {
  const result = await tap.test(suite.title, options, replay.suite(suite))

  return result === null ? false : result.ok
}

exports.test = test
