'use strict'

const { component } = require('./component')

/**
 * @param {toa.samples.suite.Operations} operations
 * @param {Record<string, toa.core.Component>} components
 * @param {boolean} autonomous
 * @return {Function}
 */
const operations = (operations, components, autonomous) =>
  async (test) => {
    for (const [id, set] of Object.entries(operations)) {
      const remote = components[id]

      await test.test(id, component(remote, set, autonomous))
    }
  }

exports.operations = operations
