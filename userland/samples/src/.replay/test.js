'use strict'

const tap = require('tap')

const replay = require('./suite')

/**
 * @param {toa.samples.Suite} suite
 * @param {Record<string, toa.core.Component>} components
 * @param {object} options
 * @return {Promise<boolean>}
 */
const test = async (suite, components, options) => {
  const result = await tap.test(suite.title, options, replay.suite(suite, components))

  return result === null ? false : result.ok
}

exports.test = test
