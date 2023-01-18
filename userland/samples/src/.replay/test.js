'use strict'

const tap = require('tap')

const { suite } = require('./suite')

/**
 * @param {toa.samples.Components} components
 * @param {Record<string, toa.core.Component>} remotes
 * @param {boolean} autonomous
 * @return {Promise<boolean>}
 */
const test = async (components, remotes, autonomous) => {
  const results = await tap.test('Replay suite', suite(components, remotes, autonomous))

  return results.ok === true
}

exports.test = test
