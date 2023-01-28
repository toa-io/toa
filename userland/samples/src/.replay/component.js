'use strict'

const { operations } = require('./operations')
const { messages } = require('./messages')

/**
 * @param {string} id
 * @param {Record<string, toa.core.Component>} remotes
 * @param {toa.samples.Component} component
 * @param {boolean} autonomous
 * @returns {function}
 */
const component = (id, remotes, component, autonomous) =>
  async (test) => {
    const remote = remotes[id]

    if (component.operations) await operations(component.operations, test, autonomous, remote)
    if (component.messages) await messages(component.messages, test, autonomous, id)

    test.end()
  }

exports.component = component
