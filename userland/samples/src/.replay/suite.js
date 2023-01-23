'use strict'

const { component } = require('./component')

/**
 * @param {toa.samples.Suite} suite
 * @param {Record<string, toa.core.Component>} remotes
 * @return {Promise<void>}
 */
const suite = (suite, remotes) =>
  async (test) => {
    for (const [id, samples] of Object.entries(suite.components)) {
      await test.test(id, component(id, remotes, samples, suite.autonomous))
    }

    test.end()
  }

exports.suite = suite
