'use strict'

const stage = require('@toa.io/userland/stage')

const { operation } = require('./operation')

/**
 *
 * @param {string} id
 * @param {toa.samples.operations.Set} set
 * @param {boolean} autonomous
 * @returns {Function}
 */
const component = (id, set, autonomous) =>
  async (test) => {
    const remote = await stage.remote(id)

    for (const [endpoint, samples] of Object.entries(set)) {
      await test.test(endpoint, operation(remote, endpoint, samples, autonomous))
    }

    await remote.disconnect()
  }

exports.component = component
