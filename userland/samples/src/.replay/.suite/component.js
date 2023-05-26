'use strict'

const stage = require('@toa.io/userland/stage')

const { operation } = require('./operation')

/**
 * @param {toa.core.Component} component
 * @param {toa.samples.operations.Set} set
 * @param {boolean} autonomous
 * @returns {Function}
 */
const component = (component, set, autonomous) =>
  async (test) => {
    for (const [endpoint, samples] of Object.entries(set)) {
      await test.test(endpoint, operation(component, endpoint, samples, autonomous))
    }
  }

exports.component = component
