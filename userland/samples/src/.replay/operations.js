'use strict'

const translate = require('./translate')

/**
 * @param {toa.samples.operations.Set} set
 * @param {any} test
 * @param {boolean} autonomous
 * @param {toa.core.Component} remote
 * @return {Promise<void>}
 */
const operations = async (set, test, autonomous, remote) => {
  for (const [endpoint, samples] of Object.entries(set)) {
    await test.test(endpoint, operation(samples, autonomous, remote, endpoint))
  }
}

/**
 * @param {toa.samples.Operation[]} operations
 * @param {boolean} autonomous
 * @param {toa.core.Component} remote
 * @param {string} endpoint
 * @returns {function}
 */
const operation = (operations, autonomous, remote, endpoint) =>
  async (test) => {
    let n = 0

    for (const operation of operations) {
      n++

      const request = translate.operation(operation, autonomous)
      const name = operation.title ?? 'Sample #' + n

      await test.test(name, async () => remote.invoke(endpoint, request))
    }

    test.end()
  }

exports.operations = operations
