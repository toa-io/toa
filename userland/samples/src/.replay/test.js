'use strict'

const tap = require('tap')

const replay = require('./suite')

/**
 * @param {toa.samples.Suite} suite
 * @param {Record<string, toa.core.Component>} remotes
 * @return {Promise<boolean>}
 */
const test = async (suite, remotes) => {
  const { ok } = await tap.test('Replay suite', replay.suite(suite, remotes))

  return ok
}

exports.test = test
