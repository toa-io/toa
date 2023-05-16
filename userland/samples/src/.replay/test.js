'use strict'

const tap = require('tap')

const replay = require('./suite')

/**
 * @param {toa.samples.Suite} suite
 * @return {Promise<boolean>}
 */
const test = async (suite) => {
  const result = await tap.test(suite.title, OPTIONS, replay.suite(suite))

  return result === null ? false : result.ok
}

const OPTIONS = { bail: true }

exports.test = test
