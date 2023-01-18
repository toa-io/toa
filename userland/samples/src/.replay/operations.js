'use strict'

const constants = require('./constants')

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
 * @param {toa.samples.operations.Sample[]} samples
 * @param {boolean} autonomous
 * @param {toa.core.Component} remote
 * @param {string} endpoint
 */
const operation = (samples, autonomous, remote, endpoint) =>
  async (test) => {
    let n = 0

    for (const sample of samples) {
      n++

      const { title, request, ...rest } = sample

      request.sample = rest
      request.sample.autonomous = autonomous

      await test.test(title ?? 'Sample ' + n, async (test) => {
        let exception

        try {
          await remote.invoke(endpoint, request)
        } catch (e) {
          exception = e
        }

        test.equal(exception, undefined, exception?.message, constants.EXTRA)
        test.end()
      })
    }

    test.end()
  }

exports.operations = operations
