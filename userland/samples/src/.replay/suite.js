'use strict'

const { component } = require('./component')

/**
 * @param {toa.samples.Components} components
 * @param {Record<string, toa.core.Component>} remotes
 * @param {boolean} autonomous
 * @return {Promise<void>}
 */
const suite = (components, remotes, autonomous) => async (test) => {
  for (const [id, samples] of Object.entries(components)) {
    await test.test(id, component(id, remotes, samples, autonomous))
  }

  test.end()
}

exports.suite = suite
