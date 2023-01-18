'use strict'

const { operations } = require('./operations')

const component = (id, remotes, component, autonomous) =>
  async (test) => {
    const remote = remotes[id]

    await operations(component.operations, test, autonomous, remote)

    test.end()
  }

exports.component = component
