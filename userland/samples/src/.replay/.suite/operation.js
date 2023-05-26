'use strict'

const translate = require('./translate')

/**
 * @param {toa.core.Component} remote
 * @param {string} endpoint
 * @param {toa.samples.Operation[]} samples
 * @param {boolean} autonomous
 * @returns {Function}
 */
const operation = (remote, endpoint, samples, autonomous) =>
  async (test) => {
    let n = 0

    for (const operation of samples) {
      n++

      const request = translate.operation(operation, autonomous)
      const name = operation.title ?? 'Sample #' + n

      await test.test(name, async () => await remote.invoke(endpoint, request))
    }

    test.end()
  }

exports.operation = operation
