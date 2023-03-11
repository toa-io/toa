'use strict'

const replay = require('./.suite')

/**
 * @param {toa.samples.Suite} suite
 * @returns {Function}
 */
const suite = (suite) =>
  async (test) => {
    if ('operations' in suite) {
      await test.test('Operations', replay.operations(suite.operations, suite.autonomous))
    }

    if ('messages' in suite) {
      await test.test('Messages', replay.messages(suite.messages, suite.autonomous))
    }

    test.end()
  }

exports.suite = suite
