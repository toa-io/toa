'use strict'

const replay = require('./.suite')

/**
 * @param {toa.samples.Suite} suite
 * @param {Record<string, toa.core.Component>} components
 * @returns {Function}
 */
const suite = (suite, components) =>
  async (test) => {
    if ('operations' in suite) {
      await test.test('Operations', replay.operations(suite.operations, components, suite.autonomous))
    }

    if ('messages' in suite) {
      await test.test('Messages', replay.messages(suite.messages, suite.autonomous))
    }

    test.end()
  }

exports.suite = suite
