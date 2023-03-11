'use strict'

const tap = require('tap')

const replay = require('./suite')

/**
 * @param {toa.samples.Suite} suite
 * @return {Promise<boolean>}
 */
const test = async (suite) => {
  const { ok } = await tap.test(suite.title, replay.suite(suite))

  return ok
}

exports.test = test
