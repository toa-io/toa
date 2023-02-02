'use strict'

const { component } = require('./component')

/**
 * @param {toa.samples.suite.Operations} operations
 * @param {boolean} autonomous
 * @return {Function}
 */
const operations = (operations, autonomous) =>
  async (test) => {
    for (const [id, set] of Object.entries(operations)) {
      await test.test(id, component(id, set, autonomous))
    }

  }

exports.operations = operations
